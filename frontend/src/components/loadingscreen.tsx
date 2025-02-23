"use client"

import React from "react"
import { motion } from "framer-motion"

const LoadingScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-[#36393F] flex flex-col items-center justify-center z-50">
      <div className="text-4xl font-bold text-white mb-8">Processing Your Data</div>
      <motion.svg
        width="100"
        height="100"
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
      >
        <motion.circle
          cx="50"
          cy="50"
          r="40"
          stroke="#7289DA"
          strokeWidth="10"
          strokeDasharray="251"
          // Animate the dash offset so the arc gives a more fluid effect
          animate={{ strokeDashoffset: [125, 0, 125] }}
          transition={{ strokeDashoffset: { repeat: Infinity, duration: 1.5, ease: "linear" } }}
        />
      </motion.svg>
    </div>
  )
}

export default LoadingScreen
