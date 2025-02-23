"use client"


import React, { useState, useEffect } from "react"
import { motion, useAnimation } from "framer-motion"


// Shapes array definition, same as in your LoadingScreen
const shapes = [
 <path key="triangle" d="M25 0L50 25L25 50L0 25L25 0Z" fill="#7289DA" />,
 <circle key="circle" cx="30" cy="30" r="30" fill="#43B581" />,
 <rect key="rectangle" width="40" height="40" rx="10" fill="#FAA61A" />,
 <path key="pentagon" d="M35 0L70 35L35 70L0 35L35 0Z" fill="#F04747" />,
]


const getRandomPosition = () => ({
 x: Math.random() * (typeof window !== "undefined" ? window.innerWidth : 1200),
 y: Math.random() * (typeof window !== "undefined" ? window.innerHeight : 800),
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
   <motion.div
     className="absolute opacity-5"
     style={{ x: initialX, y: initialY }}
     animate={controls}
   >
     {children}
   </motion.div>
 )
}


const LoadingBackground: React.FC = () => {
 const messages = [
   "Processing Your Data...",
   "Sit Tight...",
   "Hold on...",
   "Almost there...",
   "Crunching numbers...",
   "Just a sec...",
   "Your data is important...",
   "Easter Egg: Discord loves cats! 🐱...",
   "Almost done...",
   "Stay tuned...",
 ]
 const [currentMessageIndex, setCurrentMessageIndex] = useState(0)
 const [shapesData, setShapesData] = useState<
   { x: number; y: number; ShapeComponent: React.ReactNode }[]
 >([])


 useEffect(() => {
   // Generate floating shapes info
   const generatedShapes = Array.from({ length: 20 }, (_, index) => {
     const { x, y } = getRandomPosition()
     const ShapeComponent = shapes[index % shapes.length]
     return { x, y, ShapeComponent }
   })
   setShapesData(generatedShapes)


   // Cycle through messages every 4 seconds
   const interval = setInterval(() => {
     setCurrentMessageIndex((prev) => (prev + 1) % messages.length)
   }, 4000)
   return () => clearInterval(interval)
 }, [messages.length])


 return (
   <div className="fixed inset-0 z-50 overflow-hidden">
     {/* Base opaque mask to completely hide underlying Home content */}
     <div className="absolute inset-0 bg-[#36393F]" />
    
     {/* Translucent overlay for Discord-like effect */}
     <div className="absolute inset-0 bg-[#36393F]/90" />


     {/* Floating shapes layer */}
     <div className="absolute inset-0 overflow-hidden">
       {shapesData.map(({ x, y, ShapeComponent }, index) => (
         <FloatingShape key={index} initialX={x} initialY={y}>
           <svg width="50" height="50" viewBox="0 0 50 50" fill="none">
             {ShapeComponent}
           </svg>
         </FloatingShape>
       ))}
     </div>


     {/* Loading GIF and alternating message */}
     <div className="relative flex flex-col items-center justify-center w-full h-full">
       <img
         src="/discord-loading.gif"
         alt="Discord Loading Animation"
         className="w-80 h-80 object-contain"
       />
       <div className="mt-4 text-xl font-bold text-white">
         {messages[currentMessageIndex]}
       </div>
     </div>
   </div>
 )
}


export default LoadingBackground