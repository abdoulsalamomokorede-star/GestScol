'use client'

import React from 'react'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import { Bulletin, Ecole, Eleve, Matiere, Note, User, Classe } from '@/types'

// Drapeau ivoirien stylisé sous forme de ligne fine
const DrapeauLine = () => (
  <View style={{ flexDirection: 'row', height: 3, width: '100%', marginTop: 4, marginBottom: 10 }}>
    <View style={{ flex: 1, backgroundColor: '#F59E0B' }} />
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }} />
    <View style={{ flex: 1, backgroundColor: '#10B981' }} />
  </View>
)

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    padding: 30,
    color: '#1E293B',
    backgroundColor: '#FFFFFF',
  },
  // En-tête
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 8,
  },
  headerLeft: {
    width: '55%',
  },
  headerRight: {
    width: '40%',
    alignItems: 'flex-end',
  },
  orgTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
    textTransform: 'uppercase',
  },
  orgSub: {
    fontSize: 8,
    color: '#64748B',
    marginTop: 2,
  },
  schoolName: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 10,
    color: '#059669',
    marginTop: 4,
  },
  countryTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
    textAlign: 'right',
  },
  motto: {
    fontSize: 7,
    fontStyle: 'italic',
    color: '#64748B',
    marginTop: 2,
  },
  // Titre principal
  titleContainer: {
    alignItems: 'center',
    marginVertical: 12,
  },
  mainTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 14,
    color: '#059669',
    letterSpacing: 1,
  },
  subTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 10,
    marginTop: 3,
    color: '#F59E0B',
    textTransform: 'uppercase',
  },
  // Infos élève
  infoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 4,
    padding: 10,
    marginBottom: 15,
  },
  infoCol: {
    width: '48%',
    flexDirection: 'column',
    gap: 4,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  infoLabel: {
    fontFamily: 'Helvetica-Bold',
    color: '#64748B',
    width: '40%',
  },
  infoValue: {
    width: '60%',
    color: '#1E293B',
  },
  infoValueBold: {
    fontFamily: 'Helvetica-Bold',
    width: '60%',
    color: '#1E293B',
  },
  // Tableau de notes
  table: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 15,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#059669',
    color: '#FFFFFF',
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    paddingVertical: 5,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    alignItems: 'center',
    paddingVertical: 4,
  },
  tableRowAlternated: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    alignItems: 'center',
    paddingVertical: 4,
    backgroundColor: '#F8FAFC',
  },
  // Largeurs de colonnes
  colMatiere: { width: '22%', paddingLeft: 6, textAlign: 'left' },
  colDevoirs: { width: '22%', textAlign: 'center' },
  colComp: { width: '12%', textAlign: 'center' },
  colMoy: { width: '11%', textAlign: 'center', fontFamily: 'Helvetica-Bold' },
  colCoeff: { width: '8%', textAlign: 'center' },
  colPond: { width: '11%', textAlign: 'center' },
  colApprec: { width: '14%', textAlign: 'center' },
  // Total ligne
  tableTotal: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    fontFamily: 'Helvetica-Bold',
    paddingVertical: 5,
    borderTopWidth: 1,
    borderTopColor: '#64748B',
  },
  // Récapitulatif final
  summaryBlock: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  kpiBox: {
    width: '32%',
    borderWidth: 1,
    borderColor: '#059669',
    borderRadius: 4,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiLabel: {
    fontSize: 7,
    color: '#64748B',
    textTransform: 'uppercase',
    marginBottom: 2,
    fontFamily: 'Helvetica-Bold',
  },
  kpiVal: {
    fontSize: 15,
    fontFamily: 'Helvetica-Bold',
    color: '#059669',
  },
  kpiSub: {
    fontSize: 8,
    color: '#64748B',
    marginTop: 2,
  },
  conductBox: {
    width: '64%',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 4,
    padding: 8,
    backgroundColor: '#F8FAFC',
  },
  conductTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 8,
    color: '#1E293B',
    marginBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 2,
  },
  conductRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  conductLabel: {
    color: '#64748B',
  },
  conductVal: {
    fontFamily: 'Helvetica-Bold',
  },
  // Avis de l'école / Appreciation directeur
  opinionBlock: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 4,
    padding: 8,
    backgroundColor: '#F8FAFC',
    marginBottom: 20,
    minHeight: 40,
  },
  opinionTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 8,
    color: '#059669',
    marginBottom: 3,
  },
  opinionText: {
    fontSize: 8.5,
    fontStyle: 'italic',
    color: '#1E293B',
    lineHeight: 1.2,
  },
  // Espace signatures
  signatureContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  sigBlock: {
    width: '30%',
    alignItems: 'center',
  },
  sigTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 8,
    color: '#64748B',
    marginBottom: 40, // Espace pour signer
  },
  sigLine: {
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    width: '80%',
    marginTop: 4,
  },
})

interface BulletinPDFProps {
  bulletins: Bulletin[]
  ecole: Ecole
  eleves: Eleve[]
  matieres: Matiere[]
  classes: Classe[]
  enseignants: User[]
  absences: { id: string; eleveId: string; justifiee: boolean }[] // Absences du store pour calcul direct
}

export default function BulletinPDF({
  bulletins,
  ecole,
  eleves,
  matieres,
  classes,
  enseignants,
  absences,
}: BulletinPDFProps) {
  
  // Remplacer les initiales ou retours d'appreciations
  const getAppreciationMatiere = (moyenne: number) => {
    if (moyenne >= 16) return 'Excellent'
    if (moyenne >= 14) return 'Très Bien'
    if (moyenne >= 12) return 'Bien'
    if (moyenne >= 10) return 'Assez Bien'
    if (moyenne >= 8) return 'Passable'
    return 'Insuffisant'
  }

  return (
    <Document>
      {bulletins.map((bulletin) => {
        const eleve = eleves.find((e) => e.id === bulletin.eleveId)
        const classe = classes.find((c) => c.id === bulletin.classeId)
        const principal = enseignants.find((u) => u.id === classe?.enseignantPrincipalId)
        
        if (!eleve || !classe) return null

        // Calcul des absences de l'élève
        const absencesEleve = absences.filter((a) => a.eleveId === eleve.id)
        const totalAbsences = absencesEleve.length
        const absencesJustifiees = absencesEleve.filter((a) => a.justifiee).length
        const absencesNonJustifiees = totalAbsences - absencesJustifiees

        // Récupérer les matières de cette classe
        const matieresClasse = matieres.filter((m) => m.classeId === classe.id)

        // Totaux
        let totalCoefficients = 0
        let totalPointsPonderes = 0

        return (
          <Page key={bulletin.id} size="A4" style={styles.page}>
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <Text style={styles.orgTitle}>Ministère de l'Éducation Nationale</Text>
                <Text style={styles.orgTitle}>et de l'Alphabétisation</Text>
                <Text style={styles.orgSub}>DREN de la Ville d'Abidjan</Text>
                <Text style={styles.schoolName}>{ecole.nom}</Text>
                <Text style={styles.orgSub}>Tél: {ecole.telephone} | Ville: {ecole.ville}</Text>
              </View>
              <View style={styles.headerRight}>
                <Text style={styles.countryTitle}>RÉPUBLIQUE DE CÔTE D'IVOIRE</Text>
                <Text style={styles.motto}>Union - Discipline - Travail</Text>
                <DrapeauLine />
                <Text style={styles.orgSub}>Année Scolaire : {bulletin.anneeScolaire}</Text>
              </View>
            </View>

            <View style={styles.titleContainer}>
              <Text style={styles.mainTitle}>BULLETIN DE NOTES</Text>
              <Text style={styles.subTitle}>
                {bulletin.trimestre === 1 ? '1er Trimestre' : bulletin.trimestre === 2 ? '2ème Trimestre' : '3ème Trimestre'}
              </Text>
            </View>

            <View style={styles.infoContainer}>
              <View style={styles.infoCol}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Nom & Prénoms :</Text>
                  <Text style={styles.infoValueBold}>
                    {eleve.nom.toUpperCase()} {eleve.prenom}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Matricule :</Text>
                  <Text style={styles.infoValue}>{eleve.matricule}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Né(e) le :</Text>
                  <Text style={styles.infoValue}>
                    {new Date(eleve.dateNaissance).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Genre / Sexe :</Text>
                  <Text style={styles.infoValue}>{eleve.sexe === 'M' ? 'Masculin (M)' : 'Féminin (F)'}</Text>
                </View>
              </View>
              <View style={styles.infoCol}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Classe :</Text>
                  <Text style={styles.infoValueBold}>{classe.nom}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Effectif :</Text>
                  <Text style={styles.infoValue}>{bulletin.effectifClasse} élèves</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Ens. Principal :</Text>
                  <Text style={styles.infoValue}>
                    {principal ? `${principal.nom} ${principal.prenom}` : 'Non assigné'}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Statut Éleve :</Text>
                  <Text style={styles.infoValue}>{eleve.statut === 'actif' ? 'Actif / Inscrit' : eleve.statut}</Text>
                </View>
              </View>
            </View>

            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={styles.colMatiere}>Disciplines</Text>
                <Text style={styles.colDevoirs}>Notes Devoirs / Devoirs</Text>
                <Text style={styles.colComp}>Composition</Text>
                <Text style={styles.colMoy}>Moy. /20</Text>
                <Text style={styles.colCoeff}>Coeff</Text>
                <Text style={styles.colPond}>Moy. Coeff</Text>
                <Text style={styles.colApprec}>Appréciations</Text>
              </View>

              {matieresClasse.map((matiere, index) => {
                const notesMatiere = bulletin.notes.filter((n) => n.matiereId === matiere.id)
                const notesDevoirs = notesMatiere.filter((n) => n.type !== 'composition')
                const notesComp = notesMatiere.filter((n) => n.type === 'composition')

                // Calculs
                let moyenneMatiere: number | null = null
                if (notesMatiere.length > 0) {
                  const somme = notesMatiere.reduce((acc, curr) => acc + curr.valeur, 0)
                  moyenneMatiere = Number((somme / notesMatiere.length).toFixed(2))
                  totalPointsPonderes += moyenneMatiere * matiere.coefficient
                  totalCoefficients += matiere.coefficient
                }

                const devoirsStr = notesDevoirs.map((n) => n.valeur.toString()).join(' | ')
                const compStr = notesComp.map((n) => n.valeur.toString()).join(' | ')

                const rowStyle = index % 2 === 0 ? styles.tableRow : styles.tableRowAlternated

                return (
                  <View key={matiere.id} style={rowStyle}>
                    <Text style={styles.colMatiere}>{matiere.nom}</Text>
                    <Text style={styles.colDevoirs}>{devoirsStr || '-'}</Text>
                    <Text style={styles.colComp}>{compStr || '-'}</Text>
                    <Text style={styles.colMoy}>{moyenneMatiere !== null ? moyenneMatiere.toFixed(2) : '-'}</Text>
                    <Text style={styles.colCoeff}>{matiere.coefficient}</Text>
                    <Text style={styles.colPond}>
                      {moyenneMatiere !== null ? (moyenneMatiere * matiere.coefficient).toFixed(2) : '-'}
                    </Text>
                    <Text style={styles.colApprec}>
                      {moyenneMatiere !== null ? getAppreciationMatiere(moyenneMatiere) : '-'}
                    </Text>
                  </View>
                )
              })}

              <View style={styles.tableTotal}>
                <Text style={[styles.colMatiere, { textAlign: 'right', paddingRight: 10 }]}>Totaux</Text>
                <Text style={styles.colDevoirs}>-</Text>
                <Text style={styles.colComp}>-</Text>
                <Text style={styles.colMoy}>-</Text>
                <Text style={styles.colCoeff}>{totalCoefficients}</Text>
                <Text style={styles.colPond}>{totalPointsPonderes.toFixed(2)}</Text>
                <Text style={styles.colApprec}>-</Text>
              </View>
            </View>

            <View style={styles.summaryBlock}>
              <View style={styles.kpiBox}>
                <Text style={styles.kpiLabel}>Moyenne Générale</Text>
                <Text style={styles.kpiVal}>{bulletin.moyenneGenerale.toFixed(2)} /20</Text>
                <Text style={styles.kpiSub}>Classement : {bulletin.rangClasse}e / {bulletin.effectifClasse}</Text>
              </View>

              <View style={styles.kpiBox}>
                <Text style={styles.kpiLabel}>Moyenne Classe</Text>
                <Text style={styles.kpiVal}>{bulletin.moyenneClasse.toFixed(2)} /20</Text>
                <Text style={styles.kpiSub}>Mention : {bulletin.appreciation}</Text>
              </View>

              <View style={styles.conductBox}>
                <Text style={styles.conductTitle}>Assiduité & Comportement</Text>
                <View style={styles.conductRow}>
                  <Text style={styles.conductLabel}>Total des Absences :</Text>
                  <Text style={styles.conductVal}>{totalAbsences} séance(s)</Text>
                </View>
                <View style={styles.conductRow}>
                  <Text style={styles.conductLabel}>Absences Justifiées :</Text>
                  <Text style={[styles.conductVal, { color: '#059669' }]}>{absencesJustifiees} séance(s)</Text>
                </View>
                <View style={styles.conductRow}>
                  <Text style={styles.conductLabel}>Absences Non Justifiées :</Text>
                  <Text style={[styles.conductVal, { color: '#EF4444' }]}>{absencesNonJustifiees} séance(s)</Text>
                </View>
              </View>
            </View>

            <View style={styles.opinionBlock}>
              <Text style={styles.opinionTitle}>Observations & Avis du Directeur de l'Établissement</Text>
              <Text style={styles.opinionText}>
                {bulletin.appreciationDirecteur ||
                  "Aucune observation renseignée pour ce trimestre. Travail sérieux dans l'ensemble."}
              </Text>
            </View>

            <View style={styles.signatureContainer}>
              <View style={styles.sigBlock}>
                <Text style={styles.sigTitle}>Signature du Parent</Text>
                <View style={styles.sigLine} />
              </View>
              <View style={styles.sigBlock}>
                <Text style={styles.sigTitle}>Le Titulaire de la Classe</Text>
                <View style={styles.sigLine} />
              </View>
              <View style={styles.sigBlock}>
                <Text style={styles.sigTitle}>Le Directeur d'Établissement</Text>
                <Text style={{ fontSize: 7, color: '#64748B', marginTop: 10 }}>(Cachet officiel)</Text>
                <View style={styles.sigLine} />
              </View>
            </View>
          </Page>
        )
      })}
    </Document>
  )
}
