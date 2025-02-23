"use client";

import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  ArrowRight,
  FlipHorizontalIcon as SwitchHorizontal,
  BarChart2,
  MessageCircle,
  Hash,
  AtSign,
  Home,
} from "lucide-react";
import { motion, useAnimation, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

// Shapes and helper for random positions
const shapes = [
  <path key="triangle" d="M25 0L50 25L25 50L0 25L25 0Z" fill="#7289DA" />,
  <circle key="circle" cx="30" cy="30" r="30" fill="#43B581" />,
  <rect key="rectangle" width="40" height="40" rx="10" fill="#FAA61A" />,
  <path key="pentagon" d="M35 0L70 35L35 70L0 35L35 0Z" fill="#F04747" />,
  <MessageCircle key="message" size={40} color="#99AAB5" />,
  <Hash key="hash" size={40} color="#99AAB5" />,
  <AtSign key="at" size={40} color="#99AAB5" />,
];

const getRandomPosition = () => ({
  x: Math.random() * (typeof window !== "undefined" ? window.innerWidth : 1000),
  y:
    Math.random() *
    (typeof window !== "undefined" ? window.innerHeight : 1000),
});

// FloatingShape component remains unchanged
const FloatingShape = ({
  children,
  initialX,
  initialY,
}: {
  children: React.ReactNode;
  initialX: number;
  initialY: number;
}) => {
  const controls = useAnimation();

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
      });
    };
    animateShape();
  }, [controls, initialX, initialY]);

  return (
    <motion.div
      className="absolute opacity-5"
      style={{ x: initialX, y: initialY }}
      animate={controls}
    >
      {children}
    </motion.div>
  );
};

export default function Metrics() {
  const router = useRouter();
  const [currentType, setCurrentType] = useState<"basic" | "interesting">(
    "basic"
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [conversationData, setConversationData] = useState<any>(null);
  const [shapesData, setShapesData] = useState<
    { x: number; y: number; ShapeComponent: React.ReactNode }[]
  >([]);
  // State to hold the transformed interesting metrics.
  // Each object will have:
  //   header: the original metric name (used as the card header),
  //   value: the generated commentary (displayed as large text),
  //   description: the brief description (tiny text below header).
  const [commentaryData, setCommentaryData] = useState<any[]>([]);
  const backgroundControls = useAnimation();

  // Fetch conversation history on mount
  useEffect(() => {
    fetch("http://127.0.0.1:5000/getconversationhistory")
      .then((response) => response.json())
      .then((data) => setConversationData(data))
      .catch((error) =>
        console.error("Error fetching conversation history:", error)
      );
  }, []);

  useEffect(() => {
    const generatedShapes = Array.from({ length: 20 }, (_, index) => {
      const { x, y } = getRandomPosition();
      const ShapeComponent = shapes[index % shapes.length];
      return { x, y, ShapeComponent };
    });
    setShapesData(generatedShapes);
  }, [currentType, currentIndex]);

  // Once conversationData is loaded, generate commentary for interesting metrics.
  useEffect(() => {
    if (conversationData && conversationData.stats) {
      const stats = conversationData.stats;
      const interestingMetricsArray = [
        {
          originalName: "Total Emojis Used",
          value:
            stats["Emoji Usage (in text and reactions)"]?.total_emoji_used ??
            "N/A",
          description: "Total number of emojis used across all messages.",
        },
        {
          originalName: "Most Used Emoji",
          value: stats["Most Used Emoji"]?.emoji ?? "N/A",
          description:
            "The emoji that appears most frequently in conversations.",
          imageUrl: stats["Most Used Emoji"]?.imageUrl,
        },
        {
          originalName: "Dryness Score",
          value: stats["Dryness Score"] ?? "N/A",
          description:
            "A score representing how unengaging the user is from 1-10 with 1 being very unengaging and 10 being very engaging.",
        },
        {
          originalName: "Humor Score",
          value: stats["Humor Score"] ?? "N/A",
          description:
            "A score indicating how funny the user is from 1-10 with 1 being not funny and 10 being very funny.",
        },
        {
          originalName: "Romance Score",
          value:
            stats["Romance Score"] !== undefined
              ? stats["Romance Score"].toString()
              : "N/A",
          description:
            "A score representing how romantic the user is from 1-10 with 1 being not romantic and 10 being very romantic.",
        },
      ];

      Promise.all(
        interestingMetricsArray.map((metric) =>
          fetch("http://127.0.0.1:5000/generateCommentary", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            // Send metric name, value, and description.
            body: JSON.stringify({
              name: metric.originalName,
              metric: metric.value,
              description: metric.description,
            }),
          })
            .then((res) => res.json())
            .then((data) => ({
              header: metric.originalName, // original metric name used as header
              value: data.commentary, // generated commentary as large text
              description: data.description, // brief description returned by the endpoint
              imageUrl: metric.imageUrl || null,
            }))
            .catch((err) => ({
              header: metric.originalName,
              value: "Error generating commentary",
              description: "",
              imageUrl: metric.imageUrl || null,
            }))
        )
      ).then((results) => {
        setCommentaryData(results);
      });
    }
  }, [conversationData]);

  const commonTransition = {
    duration: 0.3,
    ease: "easeInOut",
  };

  const nextMetric = async () => {
    setDirection(1);
    await backgroundControls.start({
      x: -window.innerWidth,
      transition: commonTransition,
    });
    setCurrentIndex((prevIndex) => (prevIndex + 1) % metrics.length);
    backgroundControls.set({ x: window.innerWidth });
    backgroundControls.start({ x: 0, transition: commonTransition });
  };

  const prevMetric = async () => {
    setDirection(-1);
    await backgroundControls.start({
      x: -window.innerWidth,
      transition: commonTransition,
    });
    setCurrentIndex(
      (prevIndex) => (prevIndex - 1 + metrics.length) % metrics.length
    );
    backgroundControls.set({ x: -window.innerWidth });
    backgroundControls.start({ x: 0, transition: commonTransition });
  };

  const toggleMetricType = async () => {
    await backgroundControls.start({
      y: -window.innerHeight,
      transition: commonTransition,
    });
    setCurrentType((prevType) =>
      prevType === "basic" ? "interesting" : "basic"
    );
    setCurrentIndex(0);
    backgroundControls.set({ y: window.innerHeight });
    backgroundControls.start({ y: 0, transition: commonTransition });
  };

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
  };

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
  };

  // Compute the metrics array.
  // For basic metrics, we use the hardcoded names/values.
  // For interesting metrics, if commentaryData is ready, use it.
  const metrics =
    conversationData && conversationData.stats
      ? (() => {
          const stats = conversationData.stats;
          const basicMetrics = [
            {
              name: "Total Messages",
              value: stats["Message Counts and Types"]?.total_messages ?? "N/A",
              description: "",
            },
            {
              name: "Edited Messages",
              value: stats["Message Counts and Types"]?.edited_messages ?? "N/A",
              description: "",
            },
            {
              name: "Average Messages per Day",
              value:
                stats["Activity Metrics"]?.average_messages_per_day ?? "N/A",
              description: "",
            },
            {
              name: "Longest Period Without Messages",
              value:
                stats["Activity Metrics"]?.longest_period_without_messages ??
                "N/A",
              description: "",
            },
            {
              name: "Longest Active Conversation",
              value:
                stats["Activity Metrics"]?.longest_active_conversation ?? "N/A",
              description: "",
            },
            {
              name: "Most Active Year",
              value: stats["Time-Related Details"]?.most_active_year
                ? stats["Time-Related Details"].most_active_year[0]
                : "N/A",
              description: "",
            },
            {
              name: "Most Active Month",
              value: stats["Time-Related Details"]?.most_active_month
                ? stats["Time-Related Details"].most_active_month[0]
                : "N/A",
              description: "",
            },
            {
              name: "Most Active Day",
              value: stats["Time-Related Details"]?.most_active_day
                ? stats["Time-Related Details"].most_active_day[0]
                : "N/A",
              description: "",
            },
            {
              name: "Most Active Hour",
              value: stats["Time-Related Details"]?.most_active_hour
                ? stats["Time-Related Details"].most_active_hour[0]
                : "N/A",
              description: "",
            },
            {
              name: "Total Meaningful Words",
              value:
                stats["Word Usage Statistics"]?.total_meaningful_words ?? "N/A",
              description: "",
            },
            {
              name: "Unique Words Used",
              value: stats["Word Usage Statistics"]?.unique_words_used ?? "N/A",
              description: "",
            },
            {
              name: "Average Words per Message",
              value:
                stats["Word Usage Statistics"]?.average_words_per_message ??
                "N/A",
              description: "",
            },
          ];
          const interestingMetricsFallback = [
            {
              header: "Total Emoji Used",
              value: "N/A",
              description: "Total number of emojis used across all messages.",
            },
            {
              header: "Most Used Emoji",
              value: "N/A",
              description:
                "The emoji that appears most frequently in conversations.",
            },
            {
              header: "Dryness",
              value: "N/A",
              description:
                "A score representing how dry or unengaging the conversation is.",
            },
            {
              header: "Humor",
              value: "N/A",
              description:
                "A score indicating the level of humor in the conversation.",
            },
            {
              header: "Romance",
              value: "N/A",
              description: "A score representing how romantic the user is.",
            },
          ];
          return currentType === "basic"
            ? basicMetrics
            : commentaryData.length > 0
            ? commentaryData
            : interestingMetricsFallback;
        })()
      : [];

  // Updated getHeader: in interesting mode, the header is now the original metric name.
  const getHeader = () => {
    if (currentType === "basic") {
      const currentMetricName = metrics[currentIndex]?.name;
      const quirkyDescriptions: { [key: string]: string } = {
        "Total Messages": "Wow, look at that! You sent ",
        "Edited Messages": "You've refined ",
        "Average Messages per Day":
          "Every day, you ignited conversations with ",
        "Longest Period Without Messages":
          "Even legends take breaks – you went silent for ",
        "Longest Active Conversation":
          "Epic chat marathon: you kept the convo going for ",
        "Most Active Year": "The year you shined brightest: ",
        "Most Active Month": "The month you stole the spotlight: ",
        "Most Active Day": "The day you went all out: ",
        "Most Active Hour": "When the magic happened: ",
        "Total Meaningful Words":
          "Your words resonated – you typed a grand total of ",
        "Unique Words Used": "Your vocabulary sparkle: a stunning array of ",
        "Average Words per Message":
          "Crafting each message with flair – averaging ",
      };
      return quirkyDescriptions[currentMetricName] || "Your Basic Metrics";
    } else {
      // For interesting metrics, append an appropriate emoji.
      const header =
        metrics[currentIndex]?.header || "Your Interesting Metrics";
      const emojiMapping: Record<string, string> = {
        "Total Emojis Used": "😀",
        "Most Used Emoji": "👑",
        "Dryness Score": "🌵",
        "Humor Score": "😂",
        "Romance Score": "❤️",
      };
      return `${header} ${emojiMapping[header] || ""}`;
    }
  };

  return (
    <main className="min-h-screen bg-[#36393F] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="fixed top-4 left-4 flex gap-2 z-50">
        <Button
          variant="ghost"
          className="h-10 px-4 text-[#b5bac1] hover:text-white hover:bg-[#313338] inline-flex items-center"
          onClick={() => router.push("/")}
        >
          <Home className="h-5 w-5 mr-2" />
          Home
        </Button>
      </div>
      {/* Dynamic Background */}
      <motion.div
        key={currentType + currentIndex}
        className="absolute inset-0 overflow-hidden"
        initial={{ x: 0, y: 0 }}
        animate={backgroundControls}
      >
        {shapesData.map(({ x, y, ShapeComponent }) => (
          <FloatingShape
            key={`${currentType}-${x}-${y}`}
            initialX={x}
            initialY={y}
          >
            <svg
              width="50"
              height="50"
              viewBox="0 0 50 50"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {ShapeComponent}
            </svg>
          </FloatingShape>
        ))}
      </motion.div>

      {/* Main Content: Outer Container */}
      <div
        className={`
          bg-[#2F3136] p-8 rounded-lg shadow-xl relative z-20
          flex flex-col 
          ${
            currentType === "basic"
              ? "w-full max-w-md" // kinda square size for basic
              : "w-full max-w-3xl" // original for interesting
          }
        `}
      >
        <motion.h1
          className={`text-3xl font-bold text-white text-center ${
            currentType === "basic" ? "mb-6" : "mb-2"
          }`}
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {getHeader()}
        </motion.h1>

        {currentType === "interesting" && (
          <p className="text-sm text-[#99AAB5] mb-2 text-center">
            {metrics[currentIndex]?.description || ""}
          </p>
        )}

        <AnimatePresence custom={direction} mode="wait">
          <motion.div
            key={currentType + currentIndex}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={commonTransition}
            // No forced width/height here anymore
            className="bg-[#40444B] p-6 rounded-lg mb-6 mx-auto"
          >
            {currentType === "interesting" ? (
              <p className="text-3xl font-bold text-white">
                {metrics[currentIndex]?.value ?? "Loading..."}
              </p>
            ) : (
              <>
                <p className="text-4xl font-bold text-white">
                  {metrics[currentIndex]?.value ?? "Loading..."}
                </p>
                <h2 className="text-2xl font-semibold text-[#99AAB5] mb-2">
                  {metrics[currentIndex]?.name || ""}
                </h2>
              </>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation Controls */}
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={prevMetric}
            className="text-[#99AAB5] hover:text-white transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <span className="text-[#99AAB5]">
            {conversationData && metrics.length > 0
              ? currentIndex + 1
              : 0}{" "}
            / {conversationData ? metrics.length : 0}
          </span>
          <button
            onClick={nextMetric}
            className="text-[#99AAB5] hover:text-white transition-colors"
          >
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
            Switch To {currentType === "basic" ? "Our Special" : "Normal"} Metrics
          </motion.button>
        </AnimatePresence>
      </div>

      {/* View Network Graph Button */}
      <motion.button
        onClick={() => router.push("/local-graph")}
        className="bg-[#4F545C] hover:bg-[#5D646D] text-white font-bold py-2 px-4 rounded-full inline-flex items-center justify-center transition-colors duration-300 absolute bottom-4 right-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <BarChart2 className="w-5 h-5 mr-2" />
        View Network Graph
      </motion.button>
    </main>
  );
}