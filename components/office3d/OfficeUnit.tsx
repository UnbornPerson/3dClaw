import { Html, RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

import styles from "@/styles/Office.module.css";

import type { RenderedAgentState, RoomId } from "@/lib/openclaw/types";

import {
  headingToRotation,
  roomDisplayNames,
  type SeatAnchor,
  toFloorPosition
} from "./sceneData";

interface OfficeUnitProps {
  activeRoom: RoomId | "all";
  agent: RenderedAgentState;
  selected: boolean;
  seatAnchor?: SeatAnchor;
  onSelect: (agentId: string) => void;
}

export function OfficeUnit({
  activeRoom,
  agent,
  selected,
  seatAnchor,
  onSelect
}: OfficeUnitProps) {
  const bodyRef = useRef<THREE.Group>(null);
  const torsoRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const walkPhase = useRef(Math.random() * Math.PI * 2);
  const floorPosition = toFloorPosition(agent.visualPosition);
  const seatPosition = seatAnchor?.position;
  const isSeated = Boolean(seatAnchor);
  const [x, , z] = isSeated && seatPosition ? seatPosition : floorPosition;
  const dimmed = activeRoom !== "all" && activeRoom !== agent.room;
  const baseOpacity = dimmed ? 0.34 : 1;
  const rotationY = isSeated && seatAnchor ? seatAnchor.rotation : headingToRotation(agent.heading);

  useFrame((state) => {
    const time = state.clock.elapsedTime + walkPhase.current;
    const walkSwing = agent.isMoving ? Math.sin(time * 8) * 0.6 : 0;

    if (bodyRef.current) {
      const bob = agent.isMoving ? Math.sin(time * 8) * 0.06 : 0;
      bodyRef.current.position.y = isSeated ? 0.12 : 0.3 + bob;
    }

    if (torsoRef.current) {
      torsoRef.current.rotation.z = isSeated ? -0.18 : 0;
      torsoRef.current.position.y = isSeated ? -0.08 : 0;
    }

    if (leftArmRef.current && rightArmRef.current) {
      if (isSeated) {
        leftArmRef.current.rotation.z = -1.05;
        rightArmRef.current.rotation.z = -1.12;
        leftArmRef.current.rotation.x = 0.2;
        rightArmRef.current.rotation.x = -0.15;
      } else {
        leftArmRef.current.rotation.z = walkSwing;
        rightArmRef.current.rotation.z = -walkSwing;
        leftArmRef.current.rotation.x = 0;
        rightArmRef.current.rotation.x = 0;
      }
    }

    if (leftLegRef.current && rightLegRef.current) {
      if (isSeated) {
        leftLegRef.current.rotation.z = -1.38;
        rightLegRef.current.rotation.z = -1.38;
        leftLegRef.current.position.set(-0.15, -0.18, 0.14);
        rightLegRef.current.position.set(0.15, -0.18, -0.14);
      } else {
        leftLegRef.current.rotation.z = -walkSwing * 0.7;
        rightLegRef.current.rotation.z = walkSwing * 0.7;
        leftLegRef.current.position.set(-0.15, -0.12, 0);
        rightLegRef.current.position.set(0.15, -0.12, 0);
      }
    }

    if (ringRef.current) {
      ringRef.current.rotation.z += 0.02;
    }
  });

  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.48, 24]} />
        <meshBasicMaterial color="#150b07" opacity={0.22 * baseOpacity} transparent />
      </mesh>

      {selected ? (
        <mesh ref={ringRef} position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.66, 0.04, 12, 32]} />
          <meshBasicMaterial color={agent.style.accent} opacity={0.95} transparent />
        </mesh>
      ) : null}

      <group
        ref={bodyRef}
        onClick={() => onSelect(agent.id)}
        onPointerDown={(event) => event.stopPropagation()}
        rotation={[0, rotationY, 0]}
      >
        <group ref={torsoRef}>
          <RoundedBox
            args={[0.52, 0.74, 0.34]}
            castShadow
            position={[0, 0.46, 0]}
            radius={0.05}
          >
            <meshStandardMaterial color={agent.style.body} opacity={baseOpacity} transparent />
          </RoundedBox>

          <RoundedBox
            args={[0.44, 0.18, 0.2]}
            castShadow
            position={[0.02, 0.82, 0.02]}
            radius={0.04}
          >
            <meshStandardMaterial color={agent.style.accent} opacity={baseOpacity} transparent />
          </RoundedBox>

          <mesh castShadow position={[0, 1.16, 0]}>
            <boxGeometry args={[0.48, 0.5, 0.46]} />
            <meshStandardMaterial color={agent.style.skin} opacity={baseOpacity} transparent />
          </mesh>

          <mesh castShadow position={[0, 1.42, 0]}>
            <boxGeometry args={[0.52, 0.12, 0.5]} />
            <meshStandardMaterial color="#4a2318" opacity={baseOpacity} transparent />
          </mesh>

          <mesh castShadow position={[-0.08, 1.15, 0.21]}>
            <boxGeometry args={[0.07, 0.07, 0.07]} />
            <meshStandardMaterial color="#1f130e" opacity={baseOpacity} transparent />
          </mesh>

          <mesh castShadow position={[-0.08, 1.15, -0.21]}>
            <boxGeometry args={[0.07, 0.07, 0.07]} />
            <meshStandardMaterial color="#1f130e" opacity={baseOpacity} transparent />
          </mesh>

          <mesh castShadow position={[0.14, 1.02, 0.16]}>
            <boxGeometry args={[0.18, 0.04, 0.18]} />
            <meshStandardMaterial color="#2d1711" opacity={0.82 * baseOpacity} transparent />
          </mesh>

          <mesh castShadow position={[0.16, 1.52, 0.11]} rotation={[0.1, 0, 0.22]}>
            <boxGeometry args={[0.04, 0.24, 0.04]} />
            <meshStandardMaterial color={agent.style.accent} opacity={baseOpacity} transparent />
          </mesh>

          <mesh castShadow position={[0.16, 1.52, -0.11]} rotation={[-0.1, 0, 0.22]}>
            <boxGeometry args={[0.04, 0.24, 0.04]} />
            <meshStandardMaterial color={agent.style.accent} opacity={baseOpacity} transparent />
          </mesh>

          <group ref={leftArmRef} position={[-0.34, 0.72, 0.24]}>
            <mesh castShadow position={[0, -0.22, 0]}>
              <boxGeometry args={[0.16, 0.5, 0.16]} />
              <meshStandardMaterial color={agent.style.body} opacity={baseOpacity} transparent />
            </mesh>
            <mesh castShadow position={[0, -0.48, 0]}>
              <boxGeometry args={[0.14, 0.18, 0.14]} />
              <meshStandardMaterial color={agent.style.accent} opacity={baseOpacity} transparent />
            </mesh>
          </group>

          <group ref={rightArmRef} position={[-0.34, 0.72, -0.24]}>
            <mesh castShadow position={[0, -0.22, 0]}>
              <boxGeometry args={[0.16, 0.5, 0.16]} />
              <meshStandardMaterial color={agent.style.body} opacity={baseOpacity} transparent />
            </mesh>
            <mesh castShadow position={[0, -0.48, 0]}>
              <boxGeometry args={[0.14, 0.18, 0.14]} />
              <meshStandardMaterial color={agent.style.accent} opacity={baseOpacity} transparent />
            </mesh>
          </group>

          <group ref={leftLegRef} position={[-0.15, -0.12, 0]}>
            <mesh castShadow position={[0, -0.28, 0]}>
              <boxGeometry args={[0.18, 0.56, 0.18]} />
              <meshStandardMaterial color="#1f2640" opacity={baseOpacity} transparent />
            </mesh>
            <mesh castShadow position={[0, -0.59, 0.01]}>
              <boxGeometry args={[0.2, 0.1, 0.28]} />
              <meshStandardMaterial color="#15110f" opacity={baseOpacity} transparent />
            </mesh>
          </group>

          <group ref={rightLegRef} position={[0.15, -0.12, 0]}>
            <mesh castShadow position={[0, -0.28, 0]}>
              <boxGeometry args={[0.18, 0.56, 0.18]} />
              <meshStandardMaterial color="#1f2640" opacity={baseOpacity} transparent />
            </mesh>
            <mesh castShadow position={[0, -0.59, 0.01]}>
              <boxGeometry args={[0.2, 0.1, 0.28]} />
              <meshStandardMaterial color="#15110f" opacity={baseOpacity} transparent />
            </mesh>
          </group>
        </group>
      </group>

      <Html center distanceFactor={11} position={[0.14, isSeated ? 1.44 : 1.86, 0]} sprite transform>
        <button
          className={`${styles.unitLabel} ${selected ? styles.unitLabelSelected : ""} ${
            dimmed ? styles.unitLabelMuted : ""
          }`}
          onClick={() => onSelect(agent.id)}
          type="button"
        >
          <strong>{agent.name}</strong>
          <span>
            {selected
              ? `${roomDisplayNames[agent.room]} / ${
                  isSeated ? "working at desk" : agent.isMoving ? "moving" : agent.action
                }`
              : agent.style.label}
          </span>
        </button>
      </Html>
    </group>
  );
}
