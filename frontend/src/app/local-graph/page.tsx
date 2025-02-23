"use client";

import { useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Line } from "@react-three/drei";
import { X, HelpCircle, BarChart2, Home, ArrowLeftRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

// Global line width and threshold for connections.
const LINE_WIDTH = 2;
const GLOBAL_THRESHOLD = 14.0;

// Helper function to compute Euclidean distance in 3D.
const calcDistance = (pos1: number[], pos2: number[]) => {
  const dx = pos1[0] - pos2[0];
  const dy = pos1[1] - pos2[1];
  const dz = pos1[2] - pos2[2];
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
};

interface UserData {
  favorite_topic: string;
  keywords: Array<{ keyword: string; score: number }>;
  stats: {
    "Message Counts and Types": {
      total_messages: number;
      [key: string]: number;
    };
    "Dryness Score": number;
    "Humor Score": number;
    [key: string]: any;
  };
  three_d_embedding: number[];
}

interface Point {
  id: string;
  name: string;
  position: number[]; // [x, y, z]
  favoriteTopic: string;
  keywords: Array<{ keyword: string; score: number }>;
  stats: any;
  // For local graph we no longer rely on precomputed connections.
  color: string;
}

/**
 * Points component:
 * - Always draws global (dim) connections: for every unique pair of points,
 *   if their distance is below GLOBAL_THRESHOLD, draw a white line at 50% opacity.
 * - If a point is selected, additionally draw full-opacity white lines from that point
 *   to every other point within the threshold.
 * - All points are rendered as spheres. If a point is selected, a translucent highlight sphere is drawn.
 */
function Points({
  points,
  onPointClick,
  hoveredPoint,
  setHoveredPoint,
  selectedPoint,
  mainUsername,
}: {
  points: Point[];
  onPointClick: (point: Point) => void;
  hoveredPoint: Point | null;
  setHoveredPoint: (point: Point | null) => void;
  selectedPoint: Point | null;
  mainUsername: string | null;
}) {
  return (
    <group>
      {/* Global (dim) connections for every unique pair */}
      {points.map((point, i) =>
        points.slice(i + 1).map((otherPoint) => {
          const distance = calcDistance(point.position, otherPoint.position);
          if (distance < GLOBAL_THRESHOLD) {
            return (
              <Line
                key={`pair-${point.id}-${otherPoint.id}`}
                points={[
                  point.position as [number, number, number],
                  otherPoint.position as [number, number, number],
                ]}
                color="#4f545c"
                lineWidth={LINE_WIDTH}
                opacity={0.5}
                transparent
              />
            );
          }
          return null;
        })
      )}

      {/* Highlight connections from the selected point */}
      {selectedPoint &&
        points.map((point) => {
          if (point.id === selectedPoint.id) return null;
          const distance = calcDistance(selectedPoint.position, point.position);
          if (distance < GLOBAL_THRESHOLD) {
            return (
              <Line
                key={`sel-${selectedPoint.id}-${point.id}`}
                points={[
                  selectedPoint.position as [number, number, number],
                  point.position as [number, number, number],
                ]}
                color="#ffffff"
                lineWidth={LINE_WIDTH}
                opacity={1}
                transparent
              />
            );
          }
          return null;
        })}

      {/* Render all spheres */}
      {points.map((point) => (
        <group key={point.id} position={point.position as [number, number, number]}>
          <mesh
            onClick={(e) => {
              e.stopPropagation();
              onPointClick(point);
            }}
            onPointerOver={(e) => {
              e.stopPropagation();
              setHoveredPoint(point);
            }}
            onPointerOut={() => setHoveredPoint(null)}
          >
            <sphereGeometry args={[0.2, 32, 32]} />
            <meshStandardMaterial
              color={point.id === mainUsername ? "#FAA619" : "#6366f1"}
              emissive={hoveredPoint?.id === point.id ? "#ffffff" : "#000000"}
              emissiveIntensity={hoveredPoint?.id === point.id ? 0.2 : 0}
            />
          </mesh>
          {selectedPoint?.id === point.id && (
            // Highlight sphere around the selected point.
            <mesh>
              <sphereGeometry args={[GLOBAL_THRESHOLD, 32, 32]} />
              <meshStandardMaterial
                color="#ffffff"
                opacity={0.1}
                transparent
                depthWrite={false}
              />
            </mesh>
          )}
        </group>
      ))}
    </group>
  );
}

/**
 * Sidebar component displays details for the selected point.
 * It also computes the connections (i.e. nearby points) for that point using GLOBAL_THRESHOLD.
 */
function Sidebar({
  point,
  allPoints,
  onClose,
}: {
  point: Point | null;
  allPoints: Point[];
  onClose: () => void;
}) {
  if (!point) return null;

  // Compute connections: all points (excluding self) within GLOBAL_THRESHOLD.
  const connectedPoints = allPoints.filter(
    (p) => p.id !== point.id && calcDistance(point.position, p.position) < GLOBAL_THRESHOLD
  );

  // Define the metrics in a specified order.
  const metrics = [
    {
      name: "Total Messages",
      value: point.stats["Message Counts and Types"]?.total_messages ?? "N/A",
    },
    {
      name: "Average Messages per Day",
      value: point.stats["Activity Metrics"]?.average_messages_per_day ?? "N/A",
    },
    {
      name: "Longest Period Without Messages",
      value: point.stats["Activity Metrics"]?.longest_period_without_messages ?? "N/A",
    },
    {
      name: "Longest Active Conversation",
      value: point.stats["Activity Metrics"]?.longest_active_conversation ?? "N/A",
    },
    {
      name: "Most Active Year",
      value: point.stats["Time-Related Details"]?.most_active_year
        ? point.stats["Time-Related Details"].most_active_year[0]
        : "N/A",
    },
    {
      name: "Unique Words Used",
      value: point.stats["Word Usage Statistics"]?.unique_words_used ?? "N/A",
    },
    {
      name: "Average Words per Message",
      value: point.stats["Word Usage Statistics"]?.average_words_per_message ?? "N/A",
    },
    {
      name: "Total Emoji Used",
      value: point.stats["Emoji Usage (in text and reactions)"]?.total_emoji_used ?? "N/A",
    },
    {
      name: "Most Used Emoji",
      value: point.stats["Most Used Emoji"]?.emoji ?? "N/A",
    },
    {
      name: "Dryness Score",
      value: point.stats["Dryness Score"] ?? "N/A",
    },
    {
      name: "Humor Score",
      value: point.stats["Humor Score"] ?? "N/A",
    },
    {
      name: "Romance Score",
      value: point.stats["Romance Score"] ?? "N/A",
    },
  ];

  return (
    <div className="fixed right-0 top-0 h-screen w-80 bg-[#2b2d31] border-l border-[#1e1f22] p-6 text-white overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">{point.name}</h2>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-[#b5bac1] hover:text-white hover:bg-[#313338]"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </Button>
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="text-sm font-medium text-[#b5bac1]">Favorite Topic</h3>
          <p className="mt-1">{point.favoriteTopic}</p>
        </div>

        <div>
          <h3 className="text-sm font-medium text-[#b5bac1]">Top Keywords</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {point.keywords.map((kw) => (
              <span key={kw.keyword} className="px-2 py-1 rounded bg-[#313338] text-sm">
                {kw.keyword}
              </span>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-[#b5bac1]">Stats</h3>
          <div className="mt-2 space-y-2">
            {metrics.map((metric) => (
              <div key={metric.name} className="p-2 rounded bg-[#313338]">
                <span className="text-[#b5bac1]">{metric.name}:</span> {metric.value}
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-[#b5bac1]">Connections</h3>
          <div className="mt-2 space-y-2">
            {connectedPoints.length > 0 ? (
              connectedPoints.map((p) => (
                <div key={p.id} className="flex items-center gap-2 p-2 rounded bg-[#313338]">
                  <span>{p.name}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-[#b5bac1]">No nearby connections</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-[#2b2d31] p-6 rounded-lg shadow-lg text-white max-w-lg w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Graph Information</h2>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-[#b5bac1] hover:text-white hover:bg-[#313338]"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>
        </div>
        <p>
          This is a graph showing the connection between chat users in a particular chat group.
          Each node represents a user. Global connections (for every unique pair within the threshold)
          are drawn in white at lower opacity. When you click on a node, additional connections from that node
          are drawn at full opacity, and the Sidebar displays the names of the connected users.
        </p>
      </div>
    </div>
  );
}

export default function NetworkGraph() {
  const router = useRouter();
  const [selectedPoint, setSelectedPoint] = useState<Point | null>(null);
  const [hoveredPoint, setHoveredPoint] = useState<Point | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [points, setPoints] = useState<Point[]>([]);
  const [mainUsername, setMainUsername] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const main_user_response = await fetch("http://127.0.0.1:5000/api/getmainuser");
        const main_username = await main_user_response.json();

        const response = await fetch("http://127.0.0.1:5000/api/local_graph");
        const data = await response.json();

        const parsedData = Object.keys(data).reduce((acc: Record<string, UserData>, key) => {
          const user = data[key];
          acc[key] = {
            ...user,
            stats: typeof user.stats === "string" ? JSON.parse(user.stats) : user.stats,
          };
          return acc;
        }, {});

        // Transform data into points; we ignore any precomputed connections.
        const transformedPoints = Object.entries(parsedData)
          .filter(([username, userData]) => {
            const user = userData as UserData;
            const position = user.three_d_embedding;
            return Array.isArray(position) && position.every((coord) => !isNaN(coord));
          })
          .map(([username, userData]) => {
            const user = userData as UserData;
            const position = user.three_d_embedding;
            return {
              id: username,
              name: username,
              position,
              favoriteTopic: user.favorite_topic,
              keywords: user.keywords,
              stats: user.stats,
              color: "#6366f1", // You can adjust or compute color as needed.
            };
          });

        setMainUsername(main_username.username);
        setPoints(transformedPoints);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      }
    }

    fetchData();
  }, []);

  return (
    <div
      className="w-full h-screen bg-[#36393F]"
      onPointerMove={(e) => setMousePosition({ x: e.clientX, y: e.clientY })}
    >
      <div className="fixed top-4 left-4 flex gap-2 z-50">
        <Button
          variant="ghost"
          className="h-10 px-4 text-[#b5bac1] hover:text-white hover:bg-[#313338] inline-flex items-center"
          onClick={() => router.push("/")}
        >
          <Home className="h-5 w-5 mr-2" />
          Home
        </Button>
        <Button
          variant="ghost"
          className="h-10 px-4 text-[#b5bac1] hover:text-white hover:bg-[#313338] inline-flex items-center"
          onClick={() => router.push("/global-graph")}
        >
          <ArrowLeftRight className="h-5 w-5 mr-2" />
          Global Graph
        </Button>
      </div>

      <Canvas camera={{ position: [0, 0, 10], fov: 50 }}>
        <color attach="background" args={["#36393F"]} />
        <ambientLight intensity={3} />
        <pointLight position={[10, 10, 10]} />
        <Points
          points={points}
          onPointClick={setSelectedPoint}
          hoveredPoint={hoveredPoint}
          setHoveredPoint={setHoveredPoint}
          selectedPoint={selectedPoint}
          mainUsername={mainUsername}
        />
        <OrbitControls makeDefault />
      </Canvas>

      <div className="flex flex-col">
        <motion.button
          onClick={() => router.push("/metrics")}
          className="bg-[#4F545C] hover:bg-[#5D646D] text-white font-bold py-2 px-4 rounded-full inline-flex items-center justify-center transition-colors duration-300 absolute bottom-4 right-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <BarChart2 className="w-5 h-5 mr-2" />
          View Metrics
        </motion.button>
        <Sidebar point={selectedPoint} allPoints={points} onClose={() => setSelectedPoint(null)} />
      </div>

      {hoveredPoint && (
        <div
          className="fixed pointer-events-none px-2 py-1 rounded bg-[#2b2d31] text-white text-sm whitespace-nowrap transform -translate-y-full"
          style={{
            left: mousePosition.x + 10,
            top: mousePosition.y - 10,
            zIndex: 1000,
          }}
        >
          {hoveredPoint.name}
        </div>
      )}

      <Button
        variant="ghost"
        size="icon"
        className="fixed bottom-4 left-4 h-10 w-10 text-[#b5bac1] hover:text-white hover:bg-[#313338]"
        onClick={() => setIsInfoModalOpen(true)}
      >
        <HelpCircle className="h-6 w-6" />
        <span className="sr-only">Help</span>
      </Button>

      {isInfoModalOpen && <InfoModal onClose={() => setIsInfoModalOpen(false)} />}
    </div>
  );
}
