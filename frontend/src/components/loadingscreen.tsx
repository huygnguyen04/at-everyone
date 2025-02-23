"use client"

import React, { useState, useEffect } from "react"

const LoadingScreen: React.FC = () => {
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
    "Stay tuned..."
  ]
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessageIndex(prevIndex => (prevIndex + 1) % messages.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [messages.length])

  return (
    <div className="fixed inset-0 bg-[#36393F] flex flex-col items-center justify-center z-50">
      <img
        src="/discord-loading.gif"
        alt="Discord Loading Animation"
        className="w-80 h-80 object-contain"
      />
      <div className="mt-4 text-xl font-bold text-white">
        {messages[currentMessageIndex]}
      </div>
    </div>
  )
}

export default LoadingScreen
