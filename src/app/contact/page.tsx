'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, MessageSquare, Phone, Mail, MapPin, Send, CheckCircle2 } from 'lucide-react'
import logoImg from '@/app/logo.png'

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    // Simulation d'envoi
    setTimeout(() => {
      setIsSubmitting(false)
      setIsSuccess(true)
    }, 1500)
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header simple */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
            <img src={logoImg.src} alt="GestScol Logo" className="h-10 w-auto object-contain" />
            <span className="text-2xl font-display font-bold text-slate-900">
              GestScol
            </span>
          </Link>
          <Link 
            href="/" 
            className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour à l'accueil
          </Link>
        </div>
      </header>

      <main className="flex-grow py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          
          <div className="text-center space-y-4 mb-12">
            <h1 className="text-3xl sm:text-4xl font-display font-bold text-slate-900">Contactez notre équipe</h1>
            <p className="text-slate-500 max-w-2xl mx-auto text-lg">
              Une question, un besoin d'assistance ou une demande de démonstration privée ? Nous sommes là pour vous accompagner.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            
            {/* Informations de contact directes */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 mb-6">Contact Direct</h3>
                
                <div className="space-y-6">
                  <a href="https://wa.me/2250586037974" target="_blank" rel="noopener noreferrer" className="flex items-start gap-4 group">
                    <div className="bg-emerald-50 p-3 rounded-xl text-emerald-600 group-hover:bg-emerald-100 transition-colors shrink-0">
                      <MessageSquare className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 group-hover:text-emerald-600 transition-colors">WhatsApp & Assistance</p>
                      <p className="text-sm text-slate-500 mt-1">+225 05 86 03 79 74</p>
                      <p className="text-xs text-emerald-600 font-medium mt-1">Réponse en moins de 15 min</p>
                    </div>
                  </a>

                  <div className="flex items-start gap-4">
                    <div className="bg-slate-100 p-3 rounded-xl text-slate-600 shrink-0">
                      <Phone className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">Service Commercial</p>
                      <p className="text-sm text-slate-500 mt-1">+225 01 03 00 48 56</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="bg-slate-100 p-3 rounded-xl text-slate-600 shrink-0">
                      <Mail className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">Email</p>
                      <p className="text-sm text-slate-500 mt-1">contact@gestscol.ci</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="bg-slate-100 p-3 rounded-xl text-slate-600 shrink-0">
                      <MapPin className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">Bureaux</p>
                      <p className="text-sm text-slate-500 mt-1">Abidjan, Cocody<br/>Boulevard Hassan II<br/>Côte d'Ivoire</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Formulaire de contact */}
            <div className="lg:col-span-3">
              <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="text-xl font-bold text-slate-900 mb-6">Envoyez-nous un message</h3>
                
                {isSuccess ? (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-8 text-center space-y-4 animate-in fade-in zoom-in duration-500">
                    <div className="mx-auto bg-emerald-100 w-16 h-16 rounded-full flex items-center justify-center">
                      <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                    </div>
                    <h4 className="text-xl font-bold text-slate-900">Message envoyé !</h4>
                    <p className="text-slate-600 text-sm">
                      Merci de nous avoir contactés. Notre équipe vous répondra dans les plus brefs délais.
                    </p>
                    <button 
                      onClick={() => setIsSuccess(false)}
                      className="mt-4 px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg transition-colors"
                    >
                      Envoyer un autre message
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="space-y-1.5">
                        <label htmlFor="nom" className="text-sm font-medium text-slate-700">Votre nom</label>
                        <input 
                          type="text" 
                          id="nom" 
                          required 
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-sm"
                          placeholder="Ex: Kouamé Jean"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label htmlFor="ecole" className="text-sm font-medium text-slate-700">Nom de l'établissement</label>
                        <input 
                          type="text" 
                          id="ecole" 
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-sm"
                          placeholder="Ex: Groupe Scolaire Excellence"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="space-y-1.5">
                        <label htmlFor="email" className="text-sm font-medium text-slate-700">Email</label>
                        <input 
                          type="email" 
                          id="email" 
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-sm"
                          placeholder="jean@ecole.ci"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label htmlFor="phone" className="text-sm font-medium text-slate-700">Téléphone (WhatsApp)</label>
                        <input 
                          type="tel" 
                          id="phone" 
                          required
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-sm"
                          placeholder="+225 00 00 00 00 00"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="message" className="text-sm font-medium text-slate-700">Message</label>
                      <textarea 
                        id="message" 
                        required
                        rows={5}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-sm resize-none"
                        placeholder="Comment pouvons-nous vous aider ?"
                      ></textarea>
                    </div>

                    <button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold px-8 py-3 rounded-xl transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <>Envoi en cours...</>
                      ) : (
                        <>
                          Envoyer le message
                          <Send className="h-4 w-4" />
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* Footer minimaliste */}
      <footer className="bg-white border-t border-slate-200 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-slate-500">
          <p>© {new Date().getFullYear()} GestScol. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  )
}
