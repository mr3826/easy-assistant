import { Link } from 'react-router-dom';

export default function LegalTermsPage() {
  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="mx-auto max-w-3xl rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <Link to="/login" className="text-sm text-blue-600 hover:underline">
          Back to Easy Assistant
        </Link>

        <div className="mt-6 space-y-5 text-gray-700">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Terms of Service</h1>
            <p className="mt-2 text-sm text-gray-500">Placeholder terms for the MVP pilot.</p>
          </div>

          <p>
            Easy Assistant is an AI receptionist workflow for local service businesses. The MVP
            experience is intended to validate WhatsApp conversation handling, appointment
            booking, reminders, and business setup flows.
          </p>

          <p>
            Users are responsible for the accuracy of their business, staff, service,
            availability, and customer information. AI-generated responses should be reviewed
            and configured before live use with customers.
          </p>

          <p>
            These placeholder terms will be replaced with a full agreement covering account
            responsibilities, acceptable use, AI limitations, payment terms, privacy references,
            support obligations, suspension, termination, and liability before public launch.
          </p>

          <div className="border-t border-gray-200 pt-5 text-sm">
            <Link to="/privacy" className="text-blue-600 hover:underline">
              View Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
