"use client"


import type React from "react"
import { useState, useEffect } from "react"
import {
 ArrowLeft,
 ArrowRight,
 FlipHorizontalIcon as SwitchHorizontal,
 BarChart2,
 MessageCircle,
 Hash,
 AtSign,
} from "lucide-react"
import { motion, useAnimation, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"


// Placeholder data - replace with actual data from your backend
const basicMetrics = [
 { name: "Total Messages", value: "15,234" },
 { name: "Edited Messages", value: "78" },
 { name: "Average Messages per Day", value: "42" },
 { name: "Longest Period Without Messages", value: "3 days" },
 { name: "Longest Active Conversation", value: "3h 45m" },
 { name: "Most Active Year", value: "2023" },
 { name: "Most Active Month", value: "December" },
 { name: "Most Active Day", value: "Friday" },
 { name: "Most Active Hour", value: "8 PM" },
 { name: "Total Meaningful Words", value: "89,721" },
 { name: "Unique Words Used", value: "12,345" },
 { name: "Average Words per Message", value: "12 words" },
]


const interestingMetrics = [
 { name: "Total Emoji Used", value: "1,234" },
 { name: "Messages with at Least One Emoji", value: "567" },
 { name: "Total Emoji Used in Reactions", value: "89" },
 { name: "Unique Emoji Used in Reactions", value: "45" },
 { name: "Messages with at Least One Emoji Reacted", value: "23" },
 { name: "Most Used Emoji", value: "😂", imageUrl: "https://example.com/emoji.png" },
 { name: "Dryness Score", value: "3.7/10" },
 { name: "Humor Score", value: "6.2/10" },
]


const quirkyDescriptions: { [key: string]: string } = {
 "Total Messages": "You sent",
 "Edited Messages": "Edited messages",
 "Average Messages per Day": "On average, you send",
 "Longest Period Without Messages": "Longest period without messages",
 "Longest Active Conversation": "Your longest chat lasted",
 "Most Active Year": "Most active year",
 "Most Active Month": "Most active month",
 "Most Active Day": "Your most chatty day is",
 "Most Active Hour": "Most active hour",
 "Total Meaningful Words": "You typed",
 "Unique Words Used": "Unique words used",
 "Average Words per Message": "Your average message length is",
 "Total Emoji Used": "Total emoji used",
 "Messages with at Least One Emoji": "Messages with at least one emoji",
 "Total Emoji Used in Reactions": "Total emoji used in reactions",
 "Unique Emoji Used in Reactions": "Unique emoji used in reactions",
 "Messages with at Least One Emoji Reacted": "Messages with at least one emoji reacted",
 "Most Used Emoji": "Most used emoji",
 "Dryness Score": "Dryness score",
 "Humor Score": "Humor score",
}


const getRandomPosition = () => ({
 x: Math.random() * (typeof window !== "undefined" ? window.innerWidth : 1000),
 y: Math.random() * (typeof window !== "undefined" ? window.innerHeight : 1000),
})


const shapes = [
 <path key="triangle" d="M25 0L50 25L25 50L0 25L25 0Z" fill="#7289DA" />,
 <circle key="circle" cx="30" cy="30" r="30" fill="#43B581" />,
 <rect key="rectangle" width="40" height="40" rx="10" fill="#FAA61A" />,
 <path key="pentagon" d="M35 0L70 35L35 70L0 35L35 0Z" fill="#F04747" />,
 <MessageCircle key="message" size={40} color="#99AAB5" />,
 <Hash key="hash" size={40} color="#99AAB5" />,
 <AtSign key="at" size={40} color="#99AAB5" />,
]


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


export default function Metrics() {
 const router = useRouter()
 const [currentType, setCurrentType] = useState<"basic" | "interesting">("basic")
 const [currentIndex, setCurrentIndex] = useState(0)
 const [direction, setDirection] = useState(0)
 const [dynamicHeader, setDynamicHeader] = useState("Your Interesting Metrics")
 const backgroundControls = useAnimation()
 const [shapesData, setShapesData] = useState<
   { x: number; y: number; ShapeComponent: React.ReactNode }[]
 >([])


 useEffect(() => {
   const generatedShapes = Array.from({ length: 20 }, (_, index) => {
     const { x, y } = getRandomPosition()
     const ShapeComponent = shapes[index % shapes.length]
     return { x, y, ShapeComponent }
   })
   setShapesData(generatedShapes)
 }, [currentType, currentIndex])


 useEffect(() => {
   if (currentType === "interesting") {
     // Fetch the dynamic header from the backend
     fetch("/api/getDynamicHeader")
       .then((response) => response.json())
       .then((data) => setDynamicHeader(data.header))
       .catch((error) => console.error("Error fetching dynamic header:", error))
   }
 }, [currentType])


 const metrics = currentType === "basic" ? basicMetrics : interestingMetrics


 const commonTransition = {
   duration: 0.3,
   ease: "easeInOut",
 }


 const nextMetric = async () => {
   setDirection(1)
   await backgroundControls.start({ x: -window.innerWidth, transition: commonTransition })
   setCurrentIndex((prevIndex) => (prevIndex + 1) % metrics.length)
   backgroundControls.set({ x: window.innerWidth })
   backgroundControls.start({ x: 0, transition: commonTransition })
 }


 const prevMetric = async () => {
   setDirection(-1)
   await backgroundControls.start({ x: window.innerWidth, transition: commonTransition })
   setCurrentIndex((prevIndex) => (prevIndex - 1 + metrics.length) % metrics.length)
   backgroundControls.set({ x: -window.innerWidth })
   backgroundControls.start({ x: 0, transition: commonTransition })
 }


 const toggleMetricType = async () => {
   await backgroundControls.start({ y: -window.innerHeight, transition: commonTransition })
   setCurrentType((prevType) => (prevType === "basic" ? "interesting" : "basic"))
   setCurrentIndex(0)
   backgroundControls.set({ y: window.innerHeight })
   backgroundControls.start({ y: 0, transition: commonTransition })
 }


 const variants = {
   enter: (direction: number) => ({
     x: direction > 0 ? 500 : -500,
     opacity: 0,
   }),
   center: {
     zIndex: 1,
     x: 0,
     opacity: 1,
   },
   exit: (direction: number) => ({
     zIndex: 0,
     x: direction < 0 ? 500 : -500,
     opacity: 0,
   }),
 }


 const verticalVariants = {
   enter: (direction: number) => ({
     y: direction > 0 ? 500 : -500,
     opacity: 0,
   }),
   center: {
     zIndex: 1,
     y: 0,
     opacity: 1,
   },
   exit: (direction: number) => ({
     zIndex: 0,
     y: direction < 0 ? 500 : -500,
     opacity: 0,
   }),
 }


 const getHeader = () => {
   if (currentType === "basic") {
     const currentMetricName = metrics[currentIndex].name
     return quirkyDescriptions[currentMetricName] || "Your Basic Metrics"
   }
   return dynamicHeader
 }


 return (
   <main className="min-h-screen bg-[#36393F] flex flex-col items-center justify-center p-4 relative overflow-hidden">
     {/* Dynamic Background */}
     <motion.div
       key={currentType + currentIndex}
       className="absolute inset-0 overflow-hidden"
       initial={{ x: 0, y: 0 }}
       animate={backgroundControls}
     >
       {shapesData.map(({ x, y, ShapeComponent }, index) => (
         <FloatingShape key={`${currentType}-${currentIndex}-${x}-${y}`} initialX={x} initialY={y}>
           <svg width="50" height="50" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
             {ShapeComponent}
           </svg>
         </FloatingShape>
       ))}
     </motion.div>


     {/* Main Content */}
     <div className="bg-[#2F3136] p-8 rounded-lg shadow-xl w-full max-w-md relative z-10">
       <motion.h1
         className="text-3xl font-bold text-white mb-6 text-center"
         initial={{ opacity: 0, y: -50 }}
         animate={{ opacity: 1, y: 0 }}
         transition={{ duration: 0.5 }}
       >
         {getHeader()}
       </motion.h1>


       <AnimatePresence custom={direction} mode="wait">
         <motion.div
           key={currentType + currentIndex}
           custom={direction}
           variants={variants}
           initial="enter"
           animate="center"
           exit="exit"
           transition={commonTransition}
           className="bg-[#40444B] p-6 rounded-lg mb-6"
         >
           <p className="text-4xl font-bold text-white">{metrics[currentIndex].value}</p>
           <h2 className="text-2xl font-semibold text-[#99AAB5] mb-2">{metrics[currentIndex].name}</h2>
         </motion.div>
       </AnimatePresence>


       <div className="flex justify-between items-center mb-6">
         <button onClick={prevMetric} className="text-[#99AAB5] hover:text-white transition-colors">
           <ArrowLeft className="w-6 h-6" />
         </button>
         <span className="text-[#99AAB5]">
           {currentIndex + 1} / {metrics.length}
         </span>
         <button onClick={nextMetric} className="text-[#99AAB5] hover:text-white transition-colors">
           <ArrowRight className="w-6 h-6" />
         </button>
       </div>


       <AnimatePresence mode="wait">
         <motion.button
           key={currentType}
           onClick={toggleMetricType}
           className="bg-[#7289DA] hover:bg-[#677BC4] text-white font-bold py-2 px-4 rounded-full inline-flex items-center justify-center w-full transition-colors duration-300 mb-4"
           variants={verticalVariants}
           initial="enter"
           animate="center"
           exit="exit"
           transition={commonTransition}
         >
           <SwitchHorizontal className="w-5 h-5 mr-2" />
           Switch to {currentType === "basic" ? "Interesting" : "Basic"} Metrics
         </motion.button>
       </AnimatePresence>
     </div>


     {/* View Network Graph Button */}
     <motion.button
       onClick={() => router.push("/graph")}
       className="bg-[#4F545C] hover:bg-[#5D646D] text-white font-bold py-2 px-4 rounded-full inline-flex items-center justify-center transition-colors duration-300 absolute bottom-4 right-4"
       initial={{ opacity: 0, y: 20 }}
       animate={{ opacity: 1, y: 0 }}
       transition={{ delay: 0.2 }}
     >
       <BarChart2 className="w-5 h-5 mr-2" />
       View Network Graph
     </motion.button>
   </main>
 )
}
