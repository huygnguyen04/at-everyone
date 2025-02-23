"use client"


import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Upload, ChevronDown, ChevronUp } from "lucide-react"
import { motion, useAnimation } from "framer-motion"
import { useRouter } from "next/navigation"


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
 const router = useRouter()
 const [shapesData, setShapesData] = useState<
   { x: number; y: number; ShapeComponent: React.ReactNode }[]
 >([])
 const instructionsRef = useRef<HTMLDivElement>(null)


 useEffect(() => {
   const generatedShapes = Array.from({ length: 20 }, (_, index) => {
     const { x, y } = getRandomPosition()
     const ShapeComponent = shapes[index % shapes.length]
     return { x, y, ShapeComponent }
   })
   setShapesData(generatedShapes)
 }, [])


 const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  if (file) {
    if (file.type === "application/json") {
      // Create FormData and append the file
      const formData = new FormData();
      formData.append("file", file);
      setUploadFeedback("File processing.....");
      try {
        // Replace the URL with your Flask server's URL if different
        const response = await fetch("http://127.0.0.1:5000/upload", {
          method: "POST",
          body: formData,
        });
        
        const result = await response.json();

        if (response.ok) {
          setUploadFeedback("File uploaded successfully! Redirecting...");
          // Optionally process result.data or other response data
          await new Promise((resolve) => setTimeout(resolve, 1500));
          router.push("/metrics");
        } else {
          setUploadFeedback(result.error || "File upload failed.");
        }
      } catch (error) {
        console.error("Error uploading file:", error);
        setUploadFeedback("An error occurred while uploading.");
      }
    } else {
      setUploadFeedback("Please upload a JSON file.");
    }
  }
};


 const toggleInstructions = () => {
   setIsInstructionsOpen(!isInstructionsOpen)
   if (instructionsRef.current) {
     instructionsRef.current.style.maxHeight = isInstructionsOpen ? "0px" : `${instructionsRef.current.scrollHeight}px`
   }
 }


 return (
   <main className="min-h-screen bg-[#36393F] flex flex-col items-center justify-center p-4 relative overflow-hidden">
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
       </div>
     </div>
   </main>
 )
}
