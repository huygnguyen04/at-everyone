"use client"

import { useState } from "react"
import { ArrowLeft, ArrowRight, FlipHorizontalIcon as SwitchHorizontal } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

// Placeholder data - replace with actual data from your backend
const basicMetrics = [
  { name: "Total Messages", value: "15,234" },
  { name: "Average Messages per Day", value: "42" },
  { name: "Longest Active Conversation", value: "3h 45m" },
  { name: "Most Active Day", value: "Friday" },
  { name: "Total Words", value: "89,721" },
  { name: "Average Message Length", value: "12 words" },
]

const interestingMetrics = [
  { name: "Dryness Score", value: "3.7/10" },
  { name: "Flirtatiousness", value: "6.2/10" },
  { name: "Emoji Usage", value: "15%" },
  { name: "Meme References", value: "42" },
  { name: "Sarcasm Detector", value: "7.8/10" },
  { name: "Conversation Starter", value: "62%" },
]

export default function Metrics() {
  const [currentType, setCurrentType] = useState<"basic" | "interesting">("basic")
  const [currentIndex, setCurrentIndex] = useState(0)
  const [direction, setDirection] = useState(0)

  const metrics = currentType === "basic" ? basicMetrics : interestingMetrics

  const nextMetric = () => {
    setDirection(1)
    setCurrentIndex((prevIndex) => (prevIndex + 1) % metrics.length)
  }

  const prevMetric = () => {
    setDirection(-1)
    setCurrentIndex((prevIndex) => (prevIndex - 1 + metrics.length) % metrics.length)
  }

  const toggleMetricType = () => {
    setCurrentType((prevType) => (prevType === "basic" ? "interesting" : "basic"))
    setCurrentIndex(0)
  }

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
    }),
  }

  const verticalVariants = {
    enter: (direction: number) => ({
      y: direction > 0 ? 1000 : -1000,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      y: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      y: direction < 0 ? 1000 : -1000,
      opacity: 0,
    }),
  }

  return (
    <main className="min-h-screen bg-[#36393F] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="bg-[#2F3136] p-8 rounded-lg shadow-xl w-full max-w-md relative z-10">
        <motion.h1
          className="text-3xl font-bold text-white mb-6 text-center"
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Your {currentType === "basic" ? "Basic" : "Interesting"} Metrics
        </motion.h1>

        <AnimatePresence custom={direction} mode="wait">
          <motion.div
            key={currentType + currentIndex}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
            }}
            className="bg-[#40444B] p-6 rounded-lg mb-6"
          >
            <h2 className="text-2xl font-semibold text-[#99AAB5] mb-2">{metrics[currentIndex].name}</h2>
            <p className="text-4xl font-bold text-white">{metrics[currentIndex].value}</p>
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
            className="bg-[#7289DA] hover:bg-[#677BC4] text-white font-bold py-2 px-4 rounded-full inline-flex items-center justify-center w-full transition-colors duration-300"
            variants={verticalVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              y: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
            }}
          >
            <SwitchHorizontal className="w-5 h-5 mr-2" />
            Switch to {currentType === "basic" ? "Interesting" : "Basic"} Metrics
          </motion.button>
        </AnimatePresence>
      </div>
    </main>
  )
}

