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

interface OfficeSceneProps {
  activeRoom: RoomId | "all";
  agents: AgentState[];
  onSelectAgent: (agentId: string) => void;
  rooms: RoomSummary[];
  selectedAgentId: string;
}

function SceneControls() {
  const { camera, size } = useThree();

  useEffect(() => {
    const perspectiveCamera = camera as THREE.PerspectiveCamera;
    const dominant = Math.max(floorSize.width, floorSize.depth);
    const fov = THREE.MathUtils.degToRad(perspectiveCamera.fov);
    const distance = (dominant * 0.72) / Math.tan(fov / 2);

    perspectiveCamera.position.set(distance * 0.82, distance * 0.54, distance * 0.74);
    perspectiveCamera.near = 0.1;
    perspectiveCamera.far = 120;
    perspectiveCamera.lookAt(0, 1.2, 0);
    perspectiveCamera.updateProjectionMatrix();
  }, [camera, size.height, size.width]);

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

      <Html center distanceFactor={18} position={[zone.center[0], 0.24, zone.center[1]]} sprite transform>
        <div className={styles.zoneLabel}>{zone.label}</div>
      </Html>

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
              <mesh castShadow position={[0, 0.46, 0]}>
                <cylinderGeometry args={[1.75, 1.75, 0.18, 32]} />
                <meshStandardMaterial color={item.color} opacity={opacity} transparent />
              </mesh>
              <mesh castShadow position={[0, 0.18, 0]}>
                <cylinderGeometry args={[0.16, 0.2, 0.5, 16]} />
                <meshStandardMaterial color={item.accent ?? item.color} opacity={opacity} transparent />
              </mesh>
            </group>
          );
        }

        if (item.kind === "plant") {
          return (
            <group key={item.id} position={[item.position[0], 0, item.position[1]]}>
              <mesh castShadow position={[0, 0.18, 0]}>
                <cylinderGeometry args={[0.18, 0.24, 0.36, 12]} />
                <meshStandardMaterial
                  color={item.accent ?? "#795744"}
                  opacity={opacity}
                  transparent
                />
              </mesh>
              <mesh castShadow position={[0, 0.62, 0]}>
                <sphereGeometry args={[0.34, 18, 18]} />
                <meshStandardMaterial color={item.color} opacity={opacity} transparent />
              </mesh>
            </group>
          );
        }

        if (item.kind === "stool") {
          return (
            <group key={item.id} position={[item.position[0], 0, item.position[1]]}>
              <mesh castShadow position={[0, 0.24, 0]}>
                <cylinderGeometry args={[0.22, 0.24, 0.1, 16]} />
                <meshStandardMaterial color={item.color} opacity={opacity} transparent />
              </mesh>
              <mesh castShadow position={[0, 0.1, 0]}>
                <cylinderGeometry args={[0.06, 0.06, 0.22, 12]} />
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
                {[-0.65, 0.65].map((legX) => (
                  <mesh castShadow key={`${item.id}-${legX}`} position={[legX, 0.28, 0]}>
                    <boxGeometry args={[0.08, 0.56, 0.08]} />
                    <meshStandardMaterial
                      color={item.accent ?? "#704a31"}
                      opacity={opacity}
                      transparent
                    />
                  </mesh>
                ))}
              </>
            ) : null}

            {item.kind === "chair" ? (
              <>
                <RoundedBox args={[width, 0.14, depth]} castShadow position={[0, 0.34, 0]} radius={0.04}>
                  <meshStandardMaterial color={item.color} opacity={opacity} transparent />
                </RoundedBox>
                <mesh castShadow position={[0, 0.65, -0.18]}>
                  <boxGeometry args={[width, 0.5, 0.1]} />
                  <meshStandardMaterial color={item.accent ?? item.color} opacity={opacity} transparent />
                </mesh>
              </>
            ) : null}

            {item.kind === "screen" ? (
              <>
                <mesh castShadow position={[0, 0.82, 0]}>
                  <boxGeometry args={[width, height, depth]} />
                  <meshStandardMaterial color={item.color} emissive={item.color} emissiveIntensity={0.25} />
                </mesh>
                <mesh castShadow position={[0, 0.45, 0]}>
                  <boxGeometry args={[0.08, 0.45, 0.08]} />
                  <meshStandardMaterial color={item.accent ?? "#1f2530"} opacity={opacity} transparent />
                </mesh>
              </>
            ) : null}

            {item.kind === "server" ? (
              <>
                <RoundedBox args={[width, height, depth]} castShadow position={[0, height / 2, 0]} radius={0.06}>
                  <meshStandardMaterial color={item.color} opacity={opacity} transparent />
                </RoundedBox>
                {[0.45, 0.95, 1.45, 1.95].map((y) => (
                  <mesh key={`${item.id}-${y}`} position={[width / 2 + 0.01, y, 0]}>
                    <boxGeometry args={[0.02, 0.08, 0.58]} />
                    <meshBasicMaterial color={item.accent ?? "#84ddd2"} opacity={0.88 * opacity} transparent />
                  </mesh>
                ))}
              </>
            ) : null}

            {item.kind === "sofa" ? (
              <>
                <RoundedBox args={[width - 0.2, 0.4, depth]} castShadow position={[0, 0.2, 0]} radius={0.1}>
                  <meshStandardMaterial color={item.color} opacity={opacity} transparent />
                </RoundedBox>
                <RoundedBox args={[width, 0.6, 0.3]} castShadow position={[0, 0.6, -depth / 2 + 0.15]} radius={0.15}>
                  <meshStandardMaterial color={item.accent ?? item.color} opacity={opacity} transparent />
                </RoundedBox>
                <RoundedBox args={[0.25, 0.5, depth]} castShadow position={[-width / 2 + 0.125, 0.35, 0]} radius={0.1}>
                  <meshStandardMaterial color={item.accent ?? item.color} opacity={opacity} transparent />
                </RoundedBox>
                <RoundedBox args={[0.25, 0.5, depth]} castShadow position={[width / 2 - 0.125, 0.35, 0]} radius={0.1}>
                  <meshStandardMaterial color={item.accent ?? item.color} opacity={opacity} transparent />
                </RoundedBox>
              </>
            ) : null}

            {item.kind === "counter" ? (
              <RoundedBox args={[width, height, depth]} castShadow position={[0, height / 2, 0]} radius={0.06}>
                <meshStandardMaterial color={item.color} opacity={opacity} transparent />
              </RoundedBox>
            ) : null}

            {item.kind === "divider" ? (
              <mesh castShadow position={[0, height / 2, 0]}>
                <boxGeometry args={[width, height, depth]} />
                <meshStandardMaterial color={item.color} opacity={0.8 * opacity} transparent />
              </mesh>
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
  selectedAgentId
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
      <color args={["#1a0d08"]} attach="background" />
      <fog args={["#1a0d08", 18, 38]} attach="fog" />

      <ambientLight intensity={1.15} />
      <hemisphereLight args={["#ffe6bc", "#5e4f40", 0.9]} />
      <directionalLight
        castShadow
        intensity={1.6}
        position={[10, 14, 7]}
        shadow-mapSize-height={2048}
        shadow-mapSize-width={2048}
      />

      <SceneControls />

      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[floorSize.width, floorSize.depth]} />
        <meshStandardMaterial color="#f3e7c2" />
      </mesh>

      <Grid
        args={[floorSize.width, floorSize.depth]}
        cellColor="#d7c39a"
        cellSize={1}
        fadeDistance={34}
        fadeStrength={0.6}
        infiniteGrid={false}
        position={[0, 0.02, 0]}
        sectionColor="#cab382"
        sectionSize={4}
      />

      <mesh castShadow position={[0, floorSize.wallHeight / 2, -floorSize.depth / 2]}>
        <boxGeometry args={[floorSize.width, floorSize.wallHeight, 0.3]} />
        <meshStandardMaterial color="#d6d9e2" />
      </mesh>

      <mesh castShadow position={[-floorSize.width / 2, floorSize.wallHeight / 2, 0]}>
        <boxGeometry args={[0.3, floorSize.wallHeight, floorSize.depth]} />
        <meshStandardMaterial color="#eceff5" />
      </mesh>

      <mesh castShadow position={[floorSize.width / 2, floorSize.wallHeight / 2, -1.2]}>
        <boxGeometry args={[0.3, floorSize.wallHeight, floorSize.depth - 2.4]} />
        <meshStandardMaterial color="#c7cbd5" opacity={0.88} transparent />
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

      {agents.map((agent) => (
        <OfficeUnit
          activeRoom={activeRoom}
          agent={agent}
          key={agent.id}
          onSelect={onSelectAgent}
          seatAnchor={seatedAssignments.get(agent.id)}
          selected={agent.id === selectedAgentId}
        />
      ))}

      {selectedAgent ? (
        <Html center distanceFactor={16} position={[0, floorSize.wallHeight + 0.55, -floorSize.depth / 2 + 0.22]} transform>
          <div className={styles.sceneCaption}>
            <strong>{selectedAgent.name}</strong>
            <span>{`${roomDisplayNames[selectedAgent.room]} / ${selectedAgent.status}`}</span>
          </div>
        </Html>
      ) : null}
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
