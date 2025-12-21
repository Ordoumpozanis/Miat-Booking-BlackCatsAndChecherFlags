'use client';

import React from 'react';
import { X } from 'lucide-react';

interface TermsOfUseProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TermsOfUse: React.FC<TermsOfUseProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/95 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-neutral-900 border-2 border-white relative shadow-[0_0_50px_rgba(250,204,21,0.2)] flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-neutral-700 flex justify-between items-center bg-black">
          <h3 className="text-2xl font-maxwell font-bold uppercase text-yellow-400">Privacy Notice (GDPR)</h3>
          <button 
            onClick={onClose}
            className="text-neutral-500 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-8 overflow-y-auto text-left space-y-6 text-neutral-300 text-sm leading-relaxed pr-4 custom-scrollbar">
          
          <div>
            <p className="font-bold text-white">Black Cats and Chequered Flags – Booking System</p>
            <p>Website: blackcatsandchequeredflags.com</p>
            <p>Data Controller: <span className="font-bold text-white">MIAT</span> (“we”, “us”)</p>
            <p>Last updated: <span className="font-bold text-white">December 18, 2025</span></p>
            <p className="mt-2">This Privacy Notice explains how MIAT processes personal data when you make a booking for the VR artwork experience “Black Cats and Checker flags”.</p>
          </div>

          <hr className="border-neutral-800" />

          <div>
            <h4 className="text-lg font-bold text-white mb-2">1) What data we collect</h4>
            <p className="mb-2">When you book, we may collect:</p>
            <ul className="list-disc pl-5 space-y-1 mb-2">
              <li><strong className="text-white">A. Booking and ticket validation:</strong> Email address, Name (the person making the booking), Booking details (date/time slot, ticket count, status).</li>
              <li><strong className="text-white">B. Participant names:</strong> Names of participants so our staff can greet you at the entrance.</li>
            </ul>
            <p className="italic text-neutral-500">We do not intentionally collect “special category” data (e.g., health data, biometric data, political opinions).</p>
          </div>

          <div>
            <h4 className="text-lg font-bold text-white mb-2">2) Why we use your data (purposes)</h4>
            <ol className="list-decimal pl-5 space-y-1">
              <li><strong>Create and manage your booking</strong> (confirmations, changes, cancellations).</li>
              <li><strong>Validate tickets at the door</strong> and manage admission.</li>
              <li><strong>Greet participants</strong> using the provided names.</li>
              <li><strong>Produce non-identifying statistics</strong> after the exhibition.</li>
            </ol>
            <p className="mt-2">We do <strong className="text-white">not</strong> sell your personal data. We do <strong className="text-white">not</strong> use booking emails for marketing unless you separately opt in.</p>
          </div>

          <div>
            <h4 className="text-lg font-bold text-white mb-2">3) Legal bases (GDPR)</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong className="text-white">Contract (GDPR Art. 6(1)(b)):</strong> to provide the booking and ticket validation you request.</li>
              <li><strong className="text-white">Legitimate interests (GDPR Art. 6(1)(f)):</strong> operational needs (preventing duplicates, service integrity) and anonymized statistics.</li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-bold text-white mb-2">4) Where your data is stored</h4>
            <p>Your booking data is stored in a database hosted by <strong className="text-white">Supabase</strong>. We limit access to authorized staff only. If transfers occur outside the EEA, appropriate safeguards are used.</p>
          </div>

          <div>
            <h4 className="text-lg font-bold text-white mb-2">5) How long we keep your data</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong className="text-white">During exhibition:</strong> Retained to operate bookings.</li>
              <li><strong className="text-white">After exhibition:</strong> Deleted or anonymized as soon as operationally possible, no later than 30 days after the final day, unless required for legal/tax obligations.</li>
              <li><strong className="text-white">Backups:</strong> Encrypted backups retained for a limited period before rotation.</li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-bold text-white mb-2">6) Your rights</h4>
            <p>Under GDPR, you have the right to access, correct, delete, restrict processing, object to processing, and data portability. You may also lodge a complaint with your local data protection authority.</p>
          </div>

          <div>
            <h4 className="text-lg font-bold text-white mb-2">7) Deletion on demand</h4>
            <p className="mb-2">To request deletion, email us:</p>
            <div className="bg-black border border-neutral-700 p-3 font-mono text-xs">
              <p>Email: <span className="text-yellow-400">chiara.marchesi@miat.tech</span></p>
              <p>Subject: “GDPR Deletion Request – Black Cats and Chequered Flags”</p>
            </div>
            <p className="mt-2 text-xs text-neutral-400"><strong>Important:</strong> If you request deletion before your visit, your booking may be cancelled as we cannot validate admission without data.</p>
          </div>

          <div>
            <h4 className="text-lg font-bold text-white mb-2">8) Security</h4>
            <p>We take reasonable technical and organizational measures to protect your data. No system is 100% secure, but we design the flow to minimize risk.</p>
          </div>

          <div>
            <h4 className="text-lg font-bold text-white mb-2">9) Contact</h4>
            <p>Data Controller: <strong className="text-white">MIAT</strong></p>
            <p>Email: <a href="mailto:chiara.marchesi@miat.tech" className="text-yellow-400 hover:underline">miat@miat.tech</a></p>
            <p>Address: Via Alessandro Manzoni, 12 20121 Milan - Italy</p>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-700 bg-black flex justify-end">
          <button 
            onClick={onClose}
            className="bg-white text-black px-6 py-2 font-bold uppercase tracking-widest hover:bg-yellow-400 transition-colors text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};