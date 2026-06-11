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
            <p className="mt-2 text-sm text-gray-500">MVP terms for the Easy Assistant pilot.</p>
          </div>

          <p>
            Easy Assistant is an AI receptionist workflow for local service businesses. The MVP
            is designed to validate WhatsApp conversation handling, appointment booking,
            reminders, dashboard visibility, and business setup flows.
          </p>

          <p>
            You are responsible for the accuracy of your business, staff, service, availability,
            and customer information, and for keeping your account credentials secure. You are
            also responsible for any activity that happens under your account.
          </p>

          <p>
            Customer data and conversation history should be handled as confidential. Only share
            access with people who are authorized to work in the account and who need the data to
            provide the service.
          </p>

          <p>
            AI suggestions are support tools, not a guarantee of correctness. Review generated
            messages before sending them to customers, and do not rely on them as the sole source
            of truth for scheduling or customer communication.
          </p>

          <p>
            We may suspend or change the service if security, abuse, legal, or operational issues
            require it. Support during the MVP is best effort and may be limited to the in-app
            support path or the workspace owner.
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
