import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

/**
 * Route d'API Next.js (App Router) pour gérer les notifications de paiement (Webhooks) de CinetPay de manière sécurisée.
 */
export async function POST(request: Request) {
  try {
    let body: any = {}
    const contentType = request.headers.get('content-type') || ''
    
    // Extraction flexible du corps de la notification (CinetPay envoie du urlencoded par défaut)
    if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await request.formData()
      formData.forEach((value, key) => {
        body[key] = value
      })
    } else {
      body = await request.json()
    }

    const transId = body.cpm_trans_id || body.transaction_id
    const siteId = body.cpm_site_id || body.site_id

    if (!transId) {
      return NextResponse.json({ error: "Identifiant de transaction manquant." }, { status: 400 })
    }

    const supabase = createAdminClient()

    // 1. Rechercher si la transaction existe dans notre base d'abonnements
    const { data: abonnement, error: fetchError } = await supabase
      .from('abonnements')
      .select('*')
      .eq('transaction_ref', transId)
      .maybeSingle()

    if (fetchError || !abonnement) {
      console.warn(`[Webhook] Transaction ${transId} introuvable en base.`)
      return NextResponse.json({ error: "Transaction introuvable ou non reconnue." }, { status: 404 })
    }

    // Si l'abonnement est déjà actif, on retourne un succès direct pour stopper les relances du webhook
    if (abonnement.statut === 'actif') {
      return NextResponse.json({ success: true, message: "Abonnement déjà actif." })
    }

    const apiKey = process.env.CINETPAY_API_KEY
    const cinetPaySiteId = process.env.CINETPAY_SITE_ID || siteId

    let isPaymentValid = false
    let paymentAmount = 0
    let paymentMethod = 'mobile_money'

    // 2. Validation d'intégrité par appel serveur à serveur (anti-spoofing)
    if (apiKey && cinetPaySiteId) {
      try {
        console.log(`[Webhook] Vérification serveur-à-serveur de la transaction : ${transId}`)
        const res = await fetch('https://api-checkout.cinetpay.com/v2/payment/check', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            apikey: apiKey,
            site_id: cinetPaySiteId,
            transaction_id: transId
          })
        })
        
        if (!res.ok) {
          throw new Error(`Erreur API CinetPay (Status: ${res.status})`)
        }
        
        const verification = await res.json()
        
        if (verification && verification.code === '00' && verification.data && verification.data.status === 'ACCEPTED') {
          isPaymentValid = true
          paymentAmount = Number(verification.data.amount)
          paymentMethod = verification.data.payment_method || 'mobile_money'
          console.log(`[Webhook] Transaction ${transId} confirmée par CinetPay pour un montant de ${paymentAmount} FCFA.`)
        } else {
          console.warn(`[Webhook] Transaction rejetée ou invalide. Code: ${verification?.code}, Statut: ${verification?.data?.status}`)
        }
      } catch (err: any) {
        console.error("[Webhook] Erreur de communication avec CinetPay :", err.message)
        return NextResponse.json({ error: "Impossible de vérifier le statut auprès de la passerelle." }, { status: 502 })
      }
    } else {
      if (process.env.NODE_ENV === 'production') {
        console.error("[Webhook] Clés CinetPay non configurées en production ! Transaction rejetée par sécurité.")
        return NextResponse.json({ error: "Configuration de passerelle de paiement invalide." }, { status: 500 })
      }
      
      // Mode simulation / développement (sans clés CinetPay en env local)
      console.warn("[Webhook Simulation] Pas de clé API CinetPay configurée. Validation automatique en mode démo.")
      if (transId.startsWith('CP-') || transId.startsWith('SIM-')) {
        isPaymentValid = true
        paymentAmount = abonnement.plan === 'standard' ? 150000 : 250000
        paymentMethod = 'simulation'
      }
    }

    // 3. Activer l'abonnement
    if (isPaymentValid) {
      const dateDebut = new Date()
      const dateFin = new Date()
      dateFin.setFullYear(dateFin.getFullYear() + 1) // Abonnement annuel

      const { error: updateError } = await supabase
        .from('abonnements')
        .update({
          statut: 'actif',
          montant_paye: paymentAmount,
          mode_paiement: paymentMethod,
          date_debut: dateDebut.toISOString(),
          date_fin: dateFin.toISOString()
        })
        .eq('id', abonnement.id)

      if (updateError) {
        console.error("[Webhook] Erreur de mise à jour de l'abonnement :", updateError.message)
        return NextResponse.json({ error: "Erreur base de données lors de la mise à jour." }, { status: 500 })
      }

      // 4. Envoyer une notification système dans l'école pour confirmer l'abonnement
      try {
        await supabase.from('notifications').insert({
          ecole_id: abonnement.ecole_id,
          titre: "💳 Abonnement Activé avec Succès",
          description: `Félicitations ! Le paiement Mobile Money de la formule ${abonnement.plan.toUpperCase()} a été validé. Votre offre est active jusqu'au ${dateFin.toLocaleDateString('fr-FR')}.`,
          type: 'systeme',
          destinataire_role: 'directeur'
        })
      } catch (notifErr: any) {
        console.warn("[Webhook] Échec d'émission de la notification système :", notifErr.message)
      }

      return NextResponse.json({ success: true, message: "Abonnement activé avec succès." })
    }

    return NextResponse.json({ error: "Règlement non autorisé ou signature invalide." }, { status: 400 })

  } catch (globalErr: any) {
    console.error("[Webhook Exception] :", globalErr)
    return NextResponse.json({ error: "Une erreur inattendue est survenue." }, { status: 500 })
  }
}
