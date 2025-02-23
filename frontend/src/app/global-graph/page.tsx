"use client";

import { useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Line } from "@react-three/drei";
import { X, HelpCircle, BarChart2, Home, ArrowLeftRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from "@/components/ui/select";

const LINE_WIDTH = 2;

function generateConnections(points: Point[]): Record<string, string[]> {
  const connections: Record<string, string[]> = {};

  points.forEach((point) => {
    connections[point.id] = [];
    points.forEach((otherPoint) => {
      if (point.id !== otherPoint.id) {
        const distance = Math.sqrt(
          Math.pow(point.position[0] - otherPoint.position[0], 2) +
            Math.pow(point.position[1] - otherPoint.position[1], 2) +
            Math.pow(point.position[2] - otherPoint.position[2], 2)
        );
        if (distance <= 14) {
          connections[point.id].push(otherPoint.id);
        }
      }
    });
  });

  return connections;
}

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
  color: string;
}

interface Point {
  id: string;
  name: string;
  position: number[];
  connections: string[];
  favoriteTopic: string;
  keywords: Array<{ keyword: string; score: number }>;
  stats: any;
  color: string;
}

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
      {points.map((point) =>
        point.connections.map((connectionId) => {
          const connectedPoint = points.find((p) => p.id === connectionId);
          if (!connectedPoint) return null;

          const isHighlighted =
            selectedPoint &&
            (selectedPoint.id === point.id ||
              selectedPoint.id === connectionId);

          return (
            <Line
              key={`${point.id}-${connectionId}`}
              points={[
                point.position as [number, number, number],
                connectedPoint.position as [number, number, number],
              ]}
              color={isHighlighted ? "#ffffff" : "#4f545c"}
              lineWidth={LINE_WIDTH}
              opacity={isHighlighted ? 1 : 0.5}
              transparent
            />
          );
        })
      )}

      {points.map((point) => (
        <group
          key={point.id}
          position={point.position as [number, number, number]}
        >
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
              color={point.id === mainUsername ? "#FAA619" : point.color}
              emissive={hoveredPoint?.id === point.id ? "#ffffff" : "#000000"}
              emissiveIntensity={hoveredPoint?.id === point.id ? 0.2 : 0}
            />
          </mesh>
          {selectedPoint?.id === point.id && (
            <mesh>
              <sphereGeometry args={[14, 32, 32]} />
              <meshStandardMaterial
                color={point.id === mainUsername ? "#FAA619" : point.color}
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

function Sidebar({
  point,
  onClose,
}: {
  point: Point | null;
  onClose: () => void;
}) {
  if (!point) return null;

  // Define the metrics in the specified order.
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
      value:
        point.stats["Activity Metrics"]?.longest_period_without_messages ??
        "N/A",
    },
    {
      name: "Longest Active Conversation",
      value:
        point.stats["Activity Metrics"]?.longest_active_conversation ?? "N/A",
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
      value:
        point.stats["Word Usage Statistics"]?.average_words_per_message ??
        "N/A",
    },
    {
      name: "Total Emoji Used",
      value:
        point.stats["Emoji Usage (in text and reactions)"]?.total_emoji_used ??
        "N/A",
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
              <span
                key={kw.keyword}
                className="px-2 py-1 rounded bg-[#313338] text-sm"
              >
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
                <span className="text-[#b5bac1]">{metric.name}:</span>{" "}
                {metric.value}
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-[#b5bac1]">Connections</h3>
          <div className="mt-2 space-y-2">
            {point.connections.map((id) => (
              <div
                key={id}
                className="flex items-center gap-2 p-2 rounded bg-[#313338]"
              >
                <span>{id}</span>
              </div>
            ))}
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
          This graph shows the connection between chat users in a particular
          chat group. Each node represents a user. Global connections (for every
          unique pair within the threshold) are drawn in white at lower opacity.
          When you click on a node, additional connections from that node are
          highlighted in full white, and the Sidebar displays the names of the
          connected users.
        </p>
      </div>
    </div>
  );
}

interface UsernameSelectProps {
  usernames: string[];
  onSelect: (username: string) => void;
}

export function UsernameSelect({ usernames, onSelect }: UsernameSelectProps) {
  return (
    <Select onValueChange={onSelect}>
      <SelectTrigger className="w-[280px] bg-[#36393F] text-white focus:outline-none">
        <SelectValue placeholder="Select a user" />
      </SelectTrigger>
      <SelectContent className="bg-[#36393F]">
        <SelectGroup>
          {/* <SelectLabel className="text-white">Users</SelectLabel> */}
          {usernames.map((username) => (
            <SelectItem key={username} value={username} className="text-white">
              {username}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
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
  const [usernames, setUsernames] = useState<string[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const main_user_response = await fetch(
          "http://127.0.0.1:5000/api/getmainuser"
        );
        const main_username = await main_user_response.json();

        const response = await fetch("http://127.0.0.1:5000/api/global_graph");
        const data = await response.json();

        const parsedData = Object.keys(data).reduce(
          (acc: Record<string, UserData>, key) => {
            const user = data[key];
            acc[key] = {
              ...user,
              stats:
                typeof user.stats === "string"
                  ? JSON.parse(user.stats)
                  : user.stats,
            };
            return acc;
          },
          {}
        );

        // Generate random connections between users
        const usernames = Object.keys(parsedData);
        // const connections = generateConnections(transformedPoints);

        // Transform data into points
        const transformedPoints = Object.entries(parsedData)
          .filter(([username, userData]) => {
            const user = userData as UserData;
            const position = user.three_d_embedding;
            return (
              Array.isArray(position) &&
              position.every((coord) => !isNaN(coord))
            );
          })
          .map(([username, userData]) => {
            const user = userData as UserData;
            const position = user.three_d_embedding; // No need to parse
            return {
              id: username,
              name: username,
              position,
              connections: [],
              favoriteTopic: user.favorite_topic,
              keywords: user.keywords,
              stats: user.stats,
              color: user.color,
            };
          });

        // Generate connections based on distance
        const connections = generateConnections(transformedPoints);

        // Assign connections to points
        transformedPoints.forEach((point) => {
          point.connections = connections[point.id];
        });

        setUsernames(Object.keys(parsedData));
        setMainUsername(main_username.username);
        setPoints(transformedPoints);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      }
    }

    fetchData();
  }, []);

  const handleUserSelect = (username: string) => {
    const point = points.find((p) => p.id === username);
    if (point) {
      setSelectedPoint(point);
    }
  };

  return (
    <div
      className="w-full h-screen bg-[#36393F]"
      onPointerMove={(e) => {
        setMousePosition({ x: e.clientX, y: e.clientY });
      }}
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
          onClick={() => router.push("/local-graph")}
        >
          <ArrowLeftRight className="h-5 w-5 mr-2" />
          Local Graph
        </Button>
        <UsernameSelect usernames={usernames} onSelect={handleUserSelect} />
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
        <Sidebar point={selectedPoint} onClose={() => setSelectedPoint(null)} />
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

      {isInfoModalOpen && (
        <InfoModal onClose={() => setIsInfoModalOpen(false)} />
      )}
    </div>
  );
}
