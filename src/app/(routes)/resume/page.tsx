export default function ResumePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-black">My Resume</h1>
        <p className="text-gray-900">
          This feature will be available in the resume processing project
        </p>
      </div>

      <div className="rounded-lg border-2 border-dashed border-gray-300 p-12">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 text-gray-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
              />
            </svg>
          </div>
          <div className="mt-4">
            <h3 className="text-sm font-semibold text-gray-900">
              Resume Processing Coming Soon
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              This feature will be available in a separate project focused on resume
              processing and analysis.
            </p>
          </div>
          <div className="mt-6">
            <button
              type="button"
              disabled
              className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm opacity-50 cursor-not-allowed"
            >
              Coming Soon
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 