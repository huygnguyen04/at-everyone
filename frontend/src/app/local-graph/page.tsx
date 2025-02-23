"use client";

import { useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Line } from "@react-three/drei";
import { X, HelpCircle, BarChart2, Home, ArrowLeftRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

const LINE_WIDTH = 2;

function generateConnections(users: string[]): Record<string, string[]> {
  const connections: Record<string, string[]> = {};

  users.forEach((user) => {
    const numConnections = Math.floor(Math.random() * 3) + 1;
    const otherUsers = users.filter((u) => u !== user);
    const userConnections: string[] = [];

    for (let i = 0; i < numConnections; i++) {
      if (otherUsers.length > 0) {
        const randomIndex = Math.floor(Math.random() * otherUsers.length);
        userConnections.push(otherUsers[randomIndex]);
        otherUsers.splice(randomIndex, 1);
      }
    }

    connections[user] = userConnections;
  });

  Object.entries(connections).forEach(([user, userConnections]) => {
    userConnections.forEach((otherUser) => {
      if (!connections[otherUser]) {
        connections[otherUser] = [];
      }
      if (!connections[otherUser].includes(user)) {
        connections[otherUser].push(user);
      }
    });
  });

  console.log("Connections: ", connections);
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
}

interface Point {
  id: string;
  name: string;
  position: number[];
  connections: string[];
  favoriteTopic: string;
  keywords: Array<{ keyword: string; score: number }>;
  stats: any;
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
              // color={"#6366f1"}
              color={point.id === mainUsername ? "#FAA619" : "#6366f1"}
              emissive={hoveredPoint?.id === point.id ? "#ffffff" : "#000000"}
              emissiveIntensity={hoveredPoint?.id === point.id ? 0.2 : 0}
            />
          </mesh>
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
            {/* {point.keywords.slice(0, 5).map((kw) => ( */}
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
            <div className="p-2 rounded bg-[#313338]">
              <span className="text-[#b5bac1]">Total Messages:</span>{" "}
              {point.stats["Message Counts and Types"]["total_messages"]}
            </div>
            <div className="p-2 rounded bg-[#313338]">
              <span className="text-[#b5bac1]">Dryness Score:</span>{" "}
              {point.stats["Dryness Score"]}
            </div>
            <div className="p-2 rounded bg-[#313338]">
              <span className="text-[#b5bac1]">Humor Score:</span>{" "}
              {point.stats["Humor Score"]}
            </div>
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
          This is a graph showing the connection between chat users in a
          particular chat group. Each node represents a user, and the
          connections between nodes represent the interactions between users.
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
  const [usernames, setUsernames] = useState<string[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const main_user_response = await fetch(
          "http://127.0.0.1:5000/api/getmainuser"
        );
        const main_username = await main_user_response.json();

        const response = await fetch("http://127.0.0.1:5000/api/local_graph");
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
        const connections = generateConnections(usernames);

        // Transform data into points
        const transformedPoints = Object.entries(parsedData).map(
          ([username, userData]) => {
            const user = userData as UserData;
            const position = user.three_d_embedding; // No need to parse
            // No need to parse keywords and stats anymore
            return {
              id: username,
              name: username,
              position,
              connections: connections[username],
              favoriteTopic: user.favorite_topic,
              keywords: user.keywords,
              stats: user.stats,
            };
          }
        );

        setUsernames(usernames);
        setPoints(transformedPoints);
        setMainUsername(main_username.username);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      }
    }

    fetchData();
  }, []);

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
