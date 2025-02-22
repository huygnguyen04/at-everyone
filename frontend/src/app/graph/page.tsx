"use client";

import { useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Line } from "@react-three/drei";
import { X, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const LINE_WIDTH = 2; // Adjust this value to change line thickness

// Value to color mapping using Tailwind colors
const valueColorMap: Record<string, string> = {
  low: "#ef4444", // red-500
  "medium-low": "#f97316", // orange-500
  medium: "#eab308", // yellow-500
  "medium-high": "#22c55e", // green-500
  high: "#06b6d4", // cyan-500
  "very-high": "#6366f1", // indigo-500
};

// Get category based on value
function getValueCategory(value: number): string {
  if (value < 20) return "low";
  if (value < 40) return "medium-low";
  if (value < 60) return "medium";
  if (value < 80) return "medium-high";
  if (value < 90) return "high";
  return "very-high";
}

// Sample data with value field (0-100)
const networkData = [
  {
    id: 1,
    name: "Alice Johnson",
    position: [-2, 1, 0],
    connections: [2, 3],
    role: "Software Engineer",
    team: "Frontend",
    value: 85,
  },
  {
    id: 2,
    name: "Bob Smith",
    position: [2, -1, 1],
    connections: [1, 4],
    role: "Product Manager",
    team: "Mobile",
    value: 45,
  },
  {
    id: 3,
    name: "Carol Williams",
    position: [-1, -2, -1],
    connections: [1],
    role: "Designer",
    team: "UX",
    value: 92,
  },
  {
    id: 4,
    name: "David Brown",
    position: [1, 2, -2],
    connections: [2],
    role: "Data Scientist",
    team: "AI",
    value: 67,
  },
];

interface Point {
  id: number;
  name: string;
  position: number[];
  connections: number[];
  role: string;
  team: string;
  value: number;
}

function ColorLegend() {
  return (
    <div className="absolute bottom-4 right-4 bg-[#2b2d31] p-4 rounded-lg shadow-lg">
      <div className="text-white mb-2 font-medium">Value Categories</div>
      <div className="grid gap-2">
        {Object.entries(valueColorMap).map(([category, color]) => (
          <div key={category} className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded"
              style={{ backgroundColor: color }}
            />
            <span className="text-white text-sm capitalize">
              {category.replace("-", " ")}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Points({
  points,
  onPointClick,
  hoveredPoint,
  setHoveredPoint,
  selectedPoint,
}: {
  points: Point[];
  onPointClick: (point: Point) => void;
  hoveredPoint: Point | null;
  setHoveredPoint: (point: Point | null) => void;
  selectedPoint: Point | null;
}) {
  return (
    <group>
      {/* Draw lines between connected points */}
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

      {/* Draw points */}
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
              color={
                hoveredPoint?.id === point.id
                  ? "#ffffff"
                  : valueColorMap[getValueCategory(point.value)]
              }
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
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{
              backgroundColor: valueColorMap[getValueCategory(point.value)],
            }}
          />
          <span className="text-sm text-[#b5bac1] capitalize">
            {getValueCategory(point.value).replace("-", " ")}
          </span>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-[#b5bac1]">Role</h3>
            <p className="mt-1">{point.role}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-[#b5bac1]">Team</h3>
            <p className="mt-1">{point.team}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-[#b5bac1]">Value</h3>
            <p className="mt-1">{point.value}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-[#b5bac1]">Connections</h3>
            <div className="mt-2 space-y-2">
              {point.connections.map((id) => {
                const connection = networkData.find((p) => p.id === id);
                if (!connection) return null;
                return (
                  <div
                    key={id}
                    className="flex items-center gap-2 p-2 rounded bg-[#313338]"
                  >
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{
                        backgroundColor:
                          valueColorMap[getValueCategory(connection.value)],
                      }}
                    />
                    <span>{connection.name}</span>
                  </div>
                );
              })}
            </div>
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
          This graph represents the network of connections between different
          individuals. Each point represents a person, and the lines between
          points represent connections. The color of each point indicates the
          value category of the individual, ranging from low to very high.
        </p>
      </div>
    </div>
  );
}

export default function NetworkGraph() {
  const [selectedPoint, setSelectedPoint] = useState<Point | null>(null);
  const [hoveredPoint, setHoveredPoint] = useState<Point | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);

  return (
    // <div className="w-full h-screen bg-black">
    <div
      className="w-full h-screen #36393F"
      onPointerMove={(e) => {
        setMousePosition({ x: e.clientX, y: e.clientY });
      }}
    >
      <Canvas camera={{ position: [0, 0, 10], fov: 50 }}>
        <color attach="background" args={["#36393F"]} />
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <Points
          points={networkData}
          onPointClick={setSelectedPoint}
          hoveredPoint={hoveredPoint}
          setHoveredPoint={setHoveredPoint}
          selectedPoint={selectedPoint}
        />
        <OrbitControls makeDefault />
      </Canvas>

      <ColorLegend />
      <Sidebar point={selectedPoint} onClose={() => setSelectedPoint(null)} />
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
