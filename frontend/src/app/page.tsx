"use client"

import type React from "react"

import { useState } from "react"
import { Upload, ChevronDown, ChevronUp } from "lucide-react"
import { useRouter } from "next/navigation"

export default function Home() {
  const [isInstructionsOpen, setIsInstructionsOpen] = useState(false)
  const [uploadFeedback, setUploadFeedback] = useState("")
  const router = useRouter()

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.type === "application/json") {
        setUploadFeedback("File uploaded successfully! Redirecting...")
        // Here you would typically send the file to your backend
        // For now, we'll just simulate a delay and redirect
        await new Promise((resolve) => setTimeout(resolve, 1500))
        router.push("/metrics")
      } else {
        setUploadFeedback("Please upload a JSON file.")
      }
    }
  }

  return (
    <main className="min-h-screen bg-[#36393F] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI1IiBoZWlnaHQ9IjUiPgo8cmVjdCB3aWR0aD0iNSIgaGVpZ2h0PSI1IiBmaWxsPSIjZmZmIj48L3JlY3Q+CjxwYXRoIGQ9Ik0wIDVMNSAwWk02IDRMNCA2Wk0tMSAxTDEgLTFaIiBzdHJva2U9IiM4ODgiIHN0cm9rZS13aWR0aD0iMSI+PC9wYXRoPgo8L3N2Zz4=')] bg-repeat"></div>
      </div>

      <h1 className="text-5xl md:text-7xl font-bold text-center mb-12 text-white animate-fade-in-down">
        Welcome to 3-Discord
      </h1>

      <div className="bg-[#2F3136] p-8 rounded-lg shadow-xl w-full max-w-md relative z-10">
        <div className="mb-8">
          <label
            htmlFor="file-upload"
            className="cursor-pointer bg-[#7289DA] hover:bg-[#677BC4] text-white font-bold py-3 px-6 rounded-full inline-flex items-center transition-colors duration-300 w-full justify-center"
          >
            <Upload className="w-5 h-5 mr-2" />
            <span>Upload JSON File</span>
          </label>
          <input id="file-upload" type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
          {uploadFeedback && (
            <p
              className={`mt-4 text-sm ${uploadFeedback.includes("successfully") ? "text-green-400" : "text-red-400"}`}
            >
              {uploadFeedback}
            </p>
          )}
        </div>

        <div className="border-t border-[#4F545C] pt-6">
          <button
            onClick={() => setIsInstructionsOpen(!isInstructionsOpen)}
            className="flex items-center justify-between w-full text-left text-lg font-semibold text-[#99AAB5] hover:text-white transition-colors duration-300"
          >
            Instructions
            {isInstructionsOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
          {isInstructionsOpen && (
            <div className="mt-4 text-[#99AAB5] space-y-4 animate-fade-in">
              <h3 className="font-semibold mb-2 text-white">How to download your Discord chat data as a JSON file:</h3>
              <ol className="list-decimal list-inside space-y-2">
                <li>Open Discord and go to User Settings (gear icon next to your username).</li>
                <li>Scroll down and click on "Privacy & Safety".</li>
                <li>Scroll to the bottom and click on "Request all of my Data".</li>
                <li>Confirm your request and wait for Discord to email you (this may take up to 30 days).</li>
                <li>Once you receive the email, download the ZIP file containing your data.</li>
                <li>Extract the ZIP file and locate the JSON file for the chat you want to upload.</li>
                <li>Use the "Upload JSON File" button above to upload your chat data.</li>
              </ol>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}

