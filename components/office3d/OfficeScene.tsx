import { Grid, Html, Line, OrbitControls, RoundedBox } from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import * as THREE from "three";

import styles from "@/styles/Office.module.css";

import type { AgentState, RoomId, RoomSummary } from "@/lib/openclaw/types";

import {
  floorSize,
  furnitureDefinitions,
  getRoomOpacity,
  roomAnchorToWorld,
  roomDisplayNames,
  toFloorPosition,
  workstationSeatAnchors,
  zoneDefinitions
} from "./sceneData";
import { OfficeUnit } from "./OfficeUnit";
import { RoundedBoxGeometry } from "three-stdlib";

const geoCylinderPlantBase = new THREE.CylinderGeometry(0.18, 0.24, 0.36, 12);
const geoSpherePlantTop = new THREE.SphereGeometry(0.34, 18, 18);
const geoCylinderStoolSeat = new THREE.CylinderGeometry(0.22, 0.24, 0.1, 16);
const geoCylinderStoolLeg = new THREE.CylinderGeometry(0.06, 0.06, 0.22, 12);
const geoCylinderTableTop = new THREE.CylinderGeometry(1.75, 1.75, 0.18, 32);
const geoCylinderTableLeg = new THREE.CylinderGeometry(0.16, 0.2, 0.5, 16);
// Pre-compute basic standard geometries that share common sizes
const geoDeskLeg = new THREE.BoxGeometry(0.08, 0.56, 0.08);
const geoMonitorScreen = new THREE.BoxGeometry(0.7, 0.42, 0.04);
const geoMonitorStand = new THREE.BoxGeometry(0.06, 0.22, 0.1);
const geoKeyboard = new THREE.BoxGeometry(0.5, 0.02, 0.18);
const geoScreenPanel = new THREE.BoxGeometry(1, 1, 1);
const geoScreenStand = new THREE.BoxGeometry(0.08, 0.45, 0.08);
const geoChairLeg = new THREE.CylinderGeometry(0.03, 0.03, 0.3, 8);
const geoChairArmrest = new THREE.BoxGeometry(0.06, 0.04, 0.35);

interface OfficeSceneProps {
  activeRoom: RoomId | "all";
  agents: AgentState[];
  onSelectAgent: (agentId: string) => void;
  rooms: RoomSummary[];
  selectedAgentId: string;
  firstPersonMode?: boolean;
}

function SceneControls({ disabled }: { disabled?: boolean }) {
  const { camera, size } = useThree();

  useEffect(() => {
    if (disabled) return;
    const perspectiveCamera = camera as THREE.PerspectiveCamera;
    const dominant = Math.max(floorSize.width, floorSize.depth);
    const fov = THREE.MathUtils.degToRad(perspectiveCamera.fov);
    const distance = (dominant * 0.72) / Math.tan(fov / 2);

    perspectiveCamera.position.set(distance * 0.82, distance * 0.54, distance * 0.74);
    perspectiveCamera.near = 0.1;
    perspectiveCamera.far = 120;
    perspectiveCamera.lookAt(0, 1.2, 0);
    perspectiveCamera.updateProjectionMatrix();
  }, [camera, size.height, size.width, disabled]);

  if (disabled) return null;

  return (
    <OrbitControls
      enablePan={false}
      makeDefault
      maxDistance={28}
      maxPolarAngle={1.28}
      minDistance={10}
      minPolarAngle={0.55}
      target={[0, 1.2, 0]}
    />
  );
}

function RoomZone({
  activeRoom,
  room,
  selected
}: {
  activeRoom: RoomId | "all";
  room: RoomSummary;
  selected: boolean;
}) {
  const zone = zoneDefinitions.find((item) => item.room === room.id);
  const opacity = getRoomOpacity(activeRoom, room.id);
  const [anchorX, anchorY, anchorZ] = roomAnchorToWorld(room.anchor);

  if (!zone) {
    return null;
  }

  return (
    <group>
      <mesh position={[zone.center[0], 0.02, zone.center[1]]} receiveShadow>
        <boxGeometry args={[zone.size[0], 0.04, zone.size[1]]} />
        <meshStandardMaterial color={zone.fill} opacity={0.72 * opacity} transparent />
      </mesh>

      <Line
        color={zone.border}
        opacity={0.88 * opacity}
        points={[
          [zone.center[0] - zone.size[0] / 2, 0.06, zone.center[1] - zone.size[1] / 2],
          [zone.center[0] + zone.size[0] / 2, 0.06, zone.center[1] - zone.size[1] / 2],
          [zone.center[0] + zone.size[0] / 2, 0.06, zone.center[1] + zone.size[1] / 2],
          [zone.center[0] - zone.size[0] / 2, 0.06, zone.center[1] + zone.size[1] / 2],
          [zone.center[0] - zone.size[0] / 2, 0.06, zone.center[1] - zone.size[1] / 2]
        ]}
        transparent
      />

      {zone.label ? (
        <Html center distanceFactor={18} position={[zone.center[0], 0.24, zone.center[1]]} sprite transform>
          <div className={styles.zoneLabel}>{zone.label}</div>
        </Html>
      ) : null}

      {selected ? (
        <mesh position={[anchorX, anchorY + 0.02, anchorZ]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.7, 0.98, 32]} />
          <meshBasicMaterial color={room.color} opacity={0.95} transparent />
        </mesh>
      ) : null}
    </group>
  );
}

function Furniture({ activeRoom }: { activeRoom: RoomId | "all" }) {
  return (
    <>
      {furnitureDefinitions.map((item) => {
        const opacity = getRoomOpacity(activeRoom, item.room);
        const [width = 1, height = 1, depth = 1] = item.size ?? [1, 1, 1];

        if (item.kind === "meetingTable") {
          return (
            <group key={item.id} position={[item.position[0], 0, item.position[1]]}>
              <mesh castShadow position={[0, 0.46, 0]} geometry={geoCylinderTableTop}>
                <meshStandardMaterial color={item.color} opacity={opacity} transparent />
              </mesh>
              <mesh castShadow position={[0, 0.18, 0]} geometry={geoCylinderTableLeg}>
                <meshStandardMaterial color={item.accent ?? item.color} opacity={opacity} transparent />
              </mesh>
            </group>
          );
        }

        if (item.kind === "plant") {
          return (
            <group key={item.id} position={[item.position[0], 0, item.position[1]]}>
              {/* Pot */}
              <mesh castShadow position={[0, 0.25, 0]}>
                <cylinderGeometry args={[0.3, 0.25, 0.5, 12]} />
                <meshStandardMaterial color="#444" opacity={opacity} transparent roughness={0.5} />
              </mesh>
              {/* Leaves/Plant Top */}
              <group position={[0, 0.5, 0]}>
                <mesh castShadow position={[0, 0.3, 0]}>
                  <sphereGeometry args={[0.3, 12, 12]} />
                  <meshStandardMaterial color={item.color} opacity={opacity} transparent />
                </mesh>
                <mesh castShadow position={[0.2, 0.5, 0.1]} scale={[0.8, 0.8, 0.8]}>
                  <sphereGeometry args={[0.25, 12, 12]} />
                  <meshStandardMaterial color={item.accent ?? "#4caf50"} opacity={opacity} transparent />
                </mesh>
                <mesh castShadow position={[-0.15, 0.45, -0.2]} scale={[0.7, 0.7, 0.7]}>
                  <sphereGeometry args={[0.25, 12, 12]} />
                  <meshStandardMaterial color={item.accent ?? "#4caf50"} opacity={opacity} transparent />
                </mesh>
              </group>
            </group>
          );
        }

        if (item.kind === "stool") {
          return (
            <group key={item.id} position={[item.position[0], 0, item.position[1]]}>
              <mesh castShadow position={[0, 0.24, 0]} geometry={geoCylinderStoolSeat}>
                <meshStandardMaterial color={item.color} opacity={opacity} transparent />
              </mesh>
              <mesh castShadow position={[0, 0.1, 0]} geometry={geoCylinderStoolLeg}>
                <meshStandardMaterial color="#654029" opacity={opacity} transparent />
              </mesh>
            </group>
          );
        }

        return (
          <group
            key={item.id}
            position={[item.position[0], 0, item.position[1]]}
            rotation={[0, item.rotation ?? 0, 0]}
          >
            {item.kind === "desk" ? (
              <>
                <RoundedBox args={[width, height, depth]} castShadow position={[0, 0.54, 0]} radius={0.04}>
                  <meshStandardMaterial color={item.color} opacity={opacity} transparent />
                </RoundedBox>
                {/* Monitors and Keyboard */}
                <mesh castShadow geometry={geoMonitorStand} position={[0, 0.68, -0.1]}>
                  <meshStandardMaterial color="#2d3748" opacity={opacity} transparent />
                </mesh>
                <mesh castShadow geometry={geoMonitorScreen} position={[0, 0.82, -0.06]} rotation={[-0.1, 0, 0]}>
                  <meshStandardMaterial color="#1a202c" opacity={opacity} transparent />
                </mesh>
                <mesh castShadow geometry={geoKeyboard} position={[0, 0.57, 0.18]}>
                  <meshStandardMaterial color="#4a5568" opacity={opacity} transparent />
                </mesh>
                {/* Desktop Detail: Mug (Variety) */}
                {parseInt(item.id.split("-").pop() || "0") % 3 === 0 && (
                  <group position={[0.3, 0.56 + 0.06, 0.08]}>
                    <mesh castShadow>
                      <cylinderGeometry args={[0.04, 0.035, 0.12, 12]} />
                      <meshStandardMaterial color="#ef4444" opacity={opacity} transparent roughness={0.3} />
                    </mesh>
                    <mesh position={[0.045, 0, 0]} rotation={[0, 0, Math.PI/2]}>
                      <torusGeometry args={[0.025, 0.008, 8, 16, Math.PI]} />
                      <meshStandardMaterial color="#ef4444" opacity={opacity} transparent />
                    </mesh>
                  </group>
                )}
                {/* Legs */}
                {[-0.65, 0.65].map((legX) => (
                  <mesh castShadow key={`${item.id}-${legX}`} position={[legX, 0.28, 0]} geometry={geoDeskLeg}>
                    <meshStandardMaterial
                      color={item.accent ?? "#4a5568"}
                      opacity={opacity}
                      transparent
                    />
                  </mesh>
                ))}
              </>
            ) : null}

            {item.kind === "chair" ? (
              <>
                {/* Seat */}
                <RoundedBox args={[width, 0.1, depth]} castShadow position={[0, 0.38, 0]} radius={0.04}>
                  <meshStandardMaterial color={item.color} opacity={opacity} transparent />
                </RoundedBox>
                {/* Backrest — positioned on the far side from desk */}
                <RoundedBox args={[width, 0.42, 0.08]} castShadow position={[0, 0.62, depth / 2 - 0.04]} radius={0.03}>
                  <meshStandardMaterial color={item.accent ?? item.color} opacity={opacity} transparent />
                </RoundedBox>
                {/* 5 Star Base Legs */}
                {[0, 1, 2, 3, 4].map((i) => {
                  const angle = (i / 5) * Math.PI * 2;
                  return (
                    <mesh castShadow geometry={geoChairLeg} key={`${item.id}-leg-${i}`}
                      position={[Math.sin(angle) * 0.2, 0.15, Math.cos(angle) * 0.2]}>
                      <meshStandardMaterial color="#3a3a3a" opacity={opacity} transparent />
                    </mesh>
                  );
                })}
                {/* Central post */}
                <mesh castShadow position={[0, 0.25, 0]}>
                  <cylinderGeometry args={[0.04, 0.04, 0.2, 8]} />
                  <meshStandardMaterial color="#555" opacity={opacity} transparent />
                </mesh>
                {/* Armrests */}
                <mesh castShadow geometry={geoChairArmrest} position={[-width / 2 + 0.04, 0.52, -0.04]}>
                  <meshStandardMaterial color={item.accent ?? item.color} opacity={opacity} transparent />
                </mesh>
                <mesh castShadow geometry={geoChairArmrest} position={[width / 2 - 0.04, 0.52, -0.04]}>
                  <meshStandardMaterial color={item.accent ?? item.color} opacity={opacity} transparent />
                </mesh>
              </>
            ) : null}

            {item.kind === "screen" ? (
              <group position={[0, 0, 0]}>
                {/* Bookcase Main Body */}
                <RoundedBox args={[width, height, depth]} castShadow position={[0, height / 2, 0]} radius={0.02}>
                  <meshStandardMaterial color={item.color} opacity={opacity} transparent />
                </RoundedBox>
                {/* Bookcase Side Panels */}
                <mesh position={[width / 2 - 0.02, height / 2, 0]}>
                  <boxGeometry args={[0.04, height, depth + 0.01]} />
                  <meshStandardMaterial color={item.accent ?? "#222"} opacity={opacity} transparent />
                </mesh>
                <mesh position={[-width / 2 + 0.02, height / 2, 0]}>
                  <boxGeometry args={[0.04, height, depth + 0.01]} />
                  <meshStandardMaterial color={item.accent ?? "#222"} opacity={opacity} transparent />
                </mesh>
                {/* Horizontal Shelves */}
                {[0.25, 0.45, 0.65, 0.85].map((y) => (
                  <mesh key={`${item.id}-shelf-${y}`} position={[0, height * y, 0.02]}>
                    <boxGeometry args={[width * 0.9, 0.03, depth * 0.8]} />
                    <meshStandardMaterial color={item.accent ?? "#333"} opacity={opacity} transparent />
                  </mesh>
                ))}
              </group>
            ) : null}

            {item.kind === "server" ? (
              <group position={[0, 0, 0]}>
                <RoundedBox args={[width, height, depth]} castShadow position={[0, height / 2, 0]} radius={0.06}>
                  <meshStandardMaterial color={item.color} opacity={opacity} transparent metalness={0.6} roughness={0.2} />
                </RoundedBox>
                {/* Front Panel Grid */}
                <mesh position={[0, height / 2, depth / 2 + 0.01]}>
                  <boxGeometry args={[width * 0.8, height * 0.9, 0.02]} />
                  <meshStandardMaterial color="#111" opacity={opacity} transparent />
                </mesh>
                {/* Status LEDs - with offset to prevent z-fighting */}
                {[0.3, 0.4, 0.5, 0.6, 0.7, 0.8].map((y, i) => (
                  <mesh key={`${item.id}-led-${i}`} position={[width * 0.25, height * y, depth / 2 + 0.035]}>
                    <sphereGeometry args={[0.02, 8, 8]} />
                    <meshStandardMaterial 
                      color={i % 2 === 0 ? "#00ff66" : "#ffcc00"} 
                      emissive={i % 2 === 0 ? "#00ff66" : "#ffcc00"} 
                      emissiveIntensity={0.8}
                      polygonOffset
                      polygonOffsetFactor={-1}
                    />
                  </mesh>
                ))}
              </group>
            ) : null}

            {item.kind === "sofa" ? (
              <group>
                <RoundedBox args={[width - 0.2, 0.45, depth]} castShadow position={[0, 0.22, 0]} radius={0.12}>
                  <meshStandardMaterial color={item.color} opacity={opacity} transparent />
                </RoundedBox>
                <RoundedBox args={[width, 0.55, 0.3]} castShadow position={[0, 0.5, -depth / 2 + 0.15]} radius={0.15}>
                  <meshStandardMaterial color={item.accent ?? item.color} opacity={opacity} transparent />
                </RoundedBox>
                {/* Armrests */}
                <RoundedBox args={[0.25, 0.45, depth]} castShadow position={[-width / 2 + 0.125, 0.35, 0]} radius={0.1}>
                  <meshStandardMaterial color={item.accent ?? item.color} opacity={opacity} transparent />
                </RoundedBox>
                <RoundedBox args={[0.25, 0.45, depth]} castShadow position={[width / 2 - 0.125, 0.35, 0]} radius={0.1}>
                  <meshStandardMaterial color={item.accent ?? item.color} opacity={opacity} transparent />
                </RoundedBox>
                {/* Cushions */}
                <RoundedBox args={[(width - 0.6) / 2, 0.12, depth * 0.8]} position={[-width/4, 0.46, 0.05]} radius={0.05}>
                  <meshStandardMaterial color={item.color} opacity={opacity} transparent />
                </RoundedBox>
                <RoundedBox args={[(width - 0.6) / 2, 0.12, depth * 0.8]} position={[width/4, 0.46, 0.05]} radius={0.05}>
                  <meshStandardMaterial color={item.color} opacity={opacity} transparent />
                </RoundedBox>
              </group>
            ) : null}

            {item.kind === "counter" ? (
              <RoundedBox args={[width, height, depth]} castShadow position={[0, height / 2, 0]} radius={0.06}>
                <meshStandardMaterial color={item.color} opacity={opacity} transparent />
              </RoundedBox>
            ) : null}

            {item.kind === "divider" ? (
              <group position={[0, height / 2, 0]}>
                <mesh castShadow>
                  <boxGeometry args={[width, height, depth]} />
                  <meshStandardMaterial 
                    color={item.color} 
                    opacity={0.35 * opacity} 
                    transparent 
                    metalness={0.2} 
                    roughness={0.1}
                  />
                </mesh>
                {/* Top/Bottom Rails */}
                <mesh position={[0, height / 2 - 0.02, 0]}>
                  <boxGeometry args={[width + 0.02, 0.04, depth + 0.02]} />
                  <meshStandardMaterial color="#444" opacity={opacity} transparent />
                </mesh>
                <mesh position={[0, -height / 2 + 0.02, 0]}>
                  <boxGeometry args={[width + 0.02, 0.04, depth + 0.02]} />
                  <meshStandardMaterial color="#444" opacity={opacity} transparent />
                </mesh>
              </group>
            ) : null}

            {item.kind === "locker" ? (
              <>
                <RoundedBox args={[width, height, depth]} castShadow position={[0, height / 2, 0]} radius={0.04}>
                  <meshStandardMaterial color={item.color} opacity={opacity} transparent />
                </RoundedBox>
                <mesh position={[width / 2 + 0.01, height * 0.65, 0]}>
                  <boxGeometry args={[0.02, 0.12, depth * 0.54]} />
                  <meshBasicMaterial color={item.accent ?? "#eff8ff"} opacity={0.9 * opacity} transparent />
                </mesh>
              </>
            ) : null}

            {item.kind === "bench" ? (
              <>
                <RoundedBox args={[width, 0.24, depth]} castShadow position={[0, 0.5, 0]} radius={0.12}>
                  <meshStandardMaterial color={item.color} opacity={opacity} transparent />
                </RoundedBox>
                {[-width / 2 + 0.2, width / 2 - 0.2].map((legX) => (
                  <RoundedBox args={[0.15, 0.4, 0.15]} castShadow key={`${item.id}-${legX}`} position={[legX, 0.2, 0]} radius={0.05}>
                    <meshStandardMaterial color={item.accent ?? "#2d6f5d"} opacity={opacity} transparent />
                  </RoundedBox>
                ))}
              </>
            ) : null}
          </group>
        );
      })}
    </>
  );
}



function OfficeWorld({
  activeRoom,
  agents,
  onSelectAgent,
  rooms,
  selectedAgentId,
  firstPersonMode
}: OfficeSceneProps) {
  const selectedAgent = agents.find((agent) => agent.id === selectedAgentId) ?? agents[0] ?? null;
  const selectedRoomId = selectedAgent?.room ?? null;
  const roomMap = useMemo(() => new Map(rooms.map((room) => [room.id, room])), [rooms]);
  const seatedAssignments = useMemo(() => {
    const workingAgents = agents
      .filter(
        (agent) => agent.room === "workstations" && agent.status === "working"
      )
      .sort((left, right) => left.id.localeCompare(right.id));

    return new Map(
      workingAgents.map((agent, index) => [
        agent.id,
        workstationSeatAnchors[index % workstationSeatAnchors.length]
      ])
    );
  }, [agents]);

  return (
    <>
      <color args={["#0c1524"]} attach="background" />
      <fog args={["#0c1524", 22, 45]} attach="fog" />

      <ambientLight intensity={2.2} color="#b0d8ff" />
      <hemisphereLight args={["#e8f4ff", "#5a6878", 2.8]} />
      <directionalLight
        castShadow
        intensity={2.4}
        position={[10, 16, 8]}
        shadow-mapSize-height={2048}
        shadow-mapSize-width={2048}
        shadow-bias={-0.001}
      />
      <directionalLight intensity={0.8} position={[-6, 8, -4]} />
      <pointLight color="#ffe4c4" intensity={0.6} position={[0, 4, 0]} />

      <SceneControls disabled={firstPersonMode} />

      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
        <planeGeometry args={[floorSize.width, floorSize.depth]} />
        <meshStandardMaterial color="#f8f9fb" roughness={0.8} />
      </mesh>

      <Grid
        args={[floorSize.width, floorSize.depth]}
        cellColor="#e2e8f0"
        cellSize={1}
        fadeDistance={40}
        fadeStrength={0.5}
        infiniteGrid={false}
        position={[0, 0.01, 0]}
        sectionColor="#cbd5e1"
        sectionSize={4}
      />

      {/* Back Wall with Windows */}
      <group position={[0, floorSize.wallHeight / 2, -floorSize.depth / 2]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[floorSize.width, floorSize.wallHeight, 0.15]} />
          <meshStandardMaterial color="#f1f5f9" />
        </mesh>
        {/* Window Panels */}
        <group position={[0, floorSize.wallHeight * 0.1, 0.1]}>
          {[-8, -4, 0, 4, 8].map((x) => (
            <mesh key={x} position={[x, 0, 0]}>
              <boxGeometry args={[2.5, 1.4, 0.02]} />
              <meshStandardMaterial 
                color="#ffffff" 
                emissive="#ffffff" 
                emissiveIntensity={0.12} 
                opacity={0.3} 
                transparent 
                polygonOffset
                polygonOffsetFactor={-1}
              />
            </mesh>
          ))}
        </group>
      </group>

      {/* Side Wall */}
      <mesh castShadow receiveShadow position={[-floorSize.width / 2, floorSize.wallHeight / 2, 0]}>
        <boxGeometry args={[0.15, floorSize.wallHeight, floorSize.depth]} />
        <meshStandardMaterial color="#f1f5f9" />
      </mesh>

      {/* Front Glass Wall */}
      <mesh castShadow position={[floorSize.width / 2, floorSize.wallHeight / 2, -1.2]}>
        <boxGeometry args={[0.15, floorSize.wallHeight, floorSize.depth - 2.4]} />
        <meshStandardMaterial color="#e2e8f0" opacity={0.3} transparent metalness={0.5} roughness={0.1} />
      </mesh>

      {zoneDefinitions.map((zone) => {
        const room = roomMap.get(zone.room);
        if (!room) {
          return null;
        }

        return (
          <RoomZone
            activeRoom={activeRoom}
            key={zone.room}
            room={room}
            selected={selectedRoomId === zone.room || activeRoom === zone.room}
          />
        );
      })}

      <Furniture activeRoom={activeRoom} />
      {/* Furniture and Zones */}

      {agents.map((agent) => {
        const selected = agent.id === selectedAgentId;
        const seatAnchor = seatedAssignments.get(agent.id);

        return (
          <OfficeUnit
            activeRoom={activeRoom}
            agent={agent}
            key={agent.id}
            onSelect={onSelectAgent}
            seatAnchor={seatAnchor}
            selected={selected}
            firstPersonMode={selected && firstPersonMode}
          />
        );
      })}

      {/* Removed duplicate wall caption — agent info already displayed in OfficeUnit labels */}
    </>
  );
}

export function OfficeScene(props: OfficeSceneProps) {
  return (
    <Canvas
      camera={{ fov: 36, near: 0.1, far: 120, position: [15, 11, 15] }}
      className={styles.canvas}
      dpr={[1, 2]}
      shadows
    >
      <OfficeWorld {...props} />
    </Canvas>
  );
}
