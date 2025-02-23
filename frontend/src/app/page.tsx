"use client"

import React, { useState, useEffect, useRef } from "react"
import { Upload, ChevronDown, ChevronUp } from "lucide-react"
import { motion, useAnimation } from "framer-motion"
import { useRouter } from "next/navigation"
import LoadingScreen from "@/components/LoadingScreen"


const shapes = [
  <path key="triangle" d="M25 0L50 25L25 50L0 25L25 0Z" fill="#7289DA" />,
  <circle key="circle" cx="30" cy="30" r="30" fill="#43B581" />,
  <rect key="rectangle" width="40" height="40" rx="10" fill="#FAA61A" />,
  <path key="pentagon" d="M35 0L70 35L35 70L0 35L35 0Z" fill="#F04747" />,
  <Upload key="upload" size={40} color="#99AAB5" />,
]

const getRandomPosition = () => ({
  x: Math.random() * (typeof window !== "undefined" ? window.innerWidth : 1000),
  y: Math.random() * (typeof window !== "undefined" ? window.innerHeight : 1000),
})

const FloatingShape = ({
  children,
  initialX,
  initialY,
}: {
  children: React.ReactNode
  initialX: number
  initialY: number
}) => {
  const controls = useAnimation()

  useEffect(() => {
    const animateShape = async () => {
      await controls.start({
        x: [initialX - 20, initialX + 20, initialX - 20],
        y: [initialY - 20, initialY + 20, initialY - 20],
        rotate: [0, 360],
        transition: {
          duration: Math.random() * 5 + 5,
          ease: "easeInOut",
          times: [0, 0.5, 1],
          repeat: Number.POSITIVE_INFINITY,
          repeatType: "reverse",
        },
      })
    }
    animateShape()
  }, [controls, initialX, initialY])

  return (
    <motion.div className="absolute opacity-5" style={{ x: initialX, y: initialY }} animate={controls}>
      {children}
    </motion.div>
  )
}

export default function Home() {
  const [isInstructionsOpen, setIsInstructionsOpen] = useState(false)
  const [uploadFeedback, setUploadFeedback] = useState("")
  const [discordUsername, setDiscordUsername] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const [shapesData, setShapesData] = useState<{ x: number; y: number; ShapeComponent: React.ReactNode }[]>([])
  const instructionsRef = useRef<HTMLDivElement>(null)

  const toggleInstructions = () => {
    setIsInstructionsOpen((prev) => !prev)
    if (instructionsRef.current) {
      instructionsRef.current.style.maxHeight =
        instructionsRef.current.style.maxHeight === "0px" || !instructionsRef.current.style.maxHeight
          ? `${instructionsRef.current.scrollHeight}px`
          : "0px"
    }
  }

  useEffect(() => {
    const generatedShapes = Array.from({ length: 20 }, (_, index) => {
      const { x, y } = getRandomPosition()
      const ShapeComponent = shapes[index % shapes.length]
      return { x, y, ShapeComponent }
    })
    setShapesData(generatedShapes)
  }, [])

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setUploadFeedback(`File selected: ${file.name}`)
    }
  }

  const processUsername = async () => {
    if (!discordUsername.trim()) {
      throw new Error("Please enter a Discord username.")
    }
    const response = await fetch("http://127.0.0.1:5000/processUsername", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: discordUsername }),
    })
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || "Username processing failed.")
    }
    return response.json()
  }

  const uploadFile = async (file: File) => {
    const formData = new FormData()
    formData.append("file", file)
    const response = await fetch("http://127.0.0.1:5000/upload", {
      method: "POST",
      body: formData,
    })
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || "File upload failed.")
    }
    const { taskId } = await response.json()
    return taskId
  }

  const handleSubmit = async () => {
    if (!discordUsername.trim()) {
      setUploadFeedback("Please enter a Discord username.")
      return
    }
    if (!selectedFile) {
      setUploadFeedback("Please upload a JSON file.")
      return
    }
    if (selectedFile.type !== "application/json") {
      setUploadFeedback("Please upload a JSON file.")
      return
    }
    try {
      // Set loading state so that the LoadingScreen appears.
      setIsLoading(true)
      setUploadFeedback("Processing username.....")
      await processUsername() 
  
      const formData = new FormData()
      formData.append("file", selectedFile)
      setUploadFeedback("File processing.....")
      const response = await fetch("http://127.0.0.1:5000/upload", {
        method: "POST",
        body: formData,
      })
  
      const result = await response.json()
  
      if (response.ok) {
        setUploadFeedback("File uploaded successfully! Redirecting...")
        await new Promise((resolve) => setTimeout(resolve, 1500))
        router.push("/metrics")
      } else {
        setUploadFeedback(result.error || "File upload failed.")
        setIsLoading(false)
      }
    } catch (error: any) {
      console.error("Error processing username or uploading file:", error)
      setUploadFeedback(error.message || "An error occurred while processing.")
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#36393F] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {isLoading && <LoadingScreen />}
      {/* Dynamic Background */}
      <div className="absolute inset-0 overflow-hidden">
        {shapesData.map(({ x, y, ShapeComponent }, index) => (
          <FloatingShape key={`${x}-${y}`} initialX={x} initialY={y}>
            <svg width="50" height="50" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
              {ShapeComponent}
            </svg>
          </FloatingShape>
        ))}
      </div>

      <h1 className="text-5xl md:text-7xl font-bold text-center mb-12 text-white animate-fade-in-down">
        @everyone
      </h1>

      <div className="bg-[#2F3136] p-8 rounded-lg shadow-xl w-full max-w-md relative z-10">
        <div className="mb-8">
          <div className="mb-4">
            <label htmlFor="discord-username" className="block text-sm font-medium text-white mb-2">
              Discord Username
            </label>
            <input
              id="discord-username"
              type="text"
              value={discordUsername}
              onChange={(e) => setDiscordUsername(e.target.value)}
              className="border border-[#4F545C] bg-[#2F3136] text-white rounded-lg w-full p-2 focus:outline-none focus:ring-2 focus:ring-[#7289DA]"
              placeholder="e.g., bob"
            />
          </div>

          <label
            htmlFor="file-upload"
            className="cursor-pointer bg-[#7289DA] hover:bg-[#677BC4] text-white font-bold py-3 px-6 rounded-full inline-flex items-center transition-colors duration-300 w-full justify-center"
          >
            <Upload className="w-5 h-5 mr-2" />
            <span>Upload JSON File</span>
          </label>
          <input id="file-upload" type="file" accept=".json" onChange={handleFileChange} className="hidden" />
          {selectedFile && <p className="mt-2 text-sm text-green-400">File selected: {selectedFile.name}</p>}
          {uploadFeedback && !uploadFeedback.startsWith("File selected:") && (
            <p className={`mt-4 text-sm ${uploadFeedback.includes("successfully") ? "text-green-400" : "text-red-400"}`}>
              {uploadFeedback}
            </p>
          )}
        </div>

        <button
          onClick={handleSubmit}
          className="bg-[#7289DA] hover:bg-[#677BC4] text-white font-bold py-2 px-4 rounded-full inline-flex items-center justify-center w-full transition-colors duration-300 mb-4"
          disabled={isLoading}
        >
          {isLoading ? "Processing..." : "Enter"}
        </button>

        <div className="border-t border-[#4F545C] pt-6">
          <button
            onClick={toggleInstructions}
            className="flex items-center justify-between w-full text-left text-lg font-semibold text-[#99AAB5] hover:text-white transition-colors duration-300"
          >
            Instructions
            {isInstructionsOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
          <div
            ref={instructionsRef}
            className="mt-4 text-[#99AAB5] space-y-4 overflow-hidden transition-max-height duration-300"
            style={{ maxHeight: isInstructionsOpen ? `${instructionsRef.current?.scrollHeight}px` : "0px" }}
          >
            <h3 className="font-semibold mb-2 text-white">
              How to download your Discord chat data as a JSON file:
            </h3>
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
        </div>
      </div>
    </main>
  )
}
