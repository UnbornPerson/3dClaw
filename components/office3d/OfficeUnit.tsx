import { Html, Line } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three-stdlib";

import styles from "@/styles/Office.module.css";

import type { AgentHeading, AgentState, RoomId } from "@/lib/openclaw/types";

import {
  headingToRotation,
  roomDisplayNames,
  type SeatAnchor,
  toFloorPosition
} from "./sceneData";

const geoShadow = new THREE.CircleGeometry(0.36, 24);
const geoRing = new THREE.TorusGeometry(0.5, 0.04, 12, 32);

// Cute Pill-like shapes
const geoHead = new RoundedBoxGeometry(0.44, 0.4, 0.44, 4, 0.12);
const geoVisor = new RoundedBoxGeometry(0.12, 0.2, 0.42, 4, 0.06); 
const geoEar = new THREE.CylinderGeometry(0.08, 0.08, 0.06, 24);
const geoTorso = new THREE.CapsuleGeometry(0.2, 0.3, 4, 16); 
const geoCollar = new THREE.CylinderGeometry(0.12, 0.14, 0.08, 24);
const geoArm = new THREE.CapsuleGeometry(0.07, 0.25, 4, 16);
const geoHand = new THREE.SphereGeometry(0.08, 16, 16);
const geoLeg = new THREE.CapsuleGeometry(0.08, 0.2, 4, 16);
const geoFoot = new THREE.CapsuleGeometry(0.08, 0.12, 4, 16);

interface OfficeUnitProps {
  activeRoom: RoomId | "all";
  agent: AgentState;
  selected: boolean;
  seatAnchor?: SeatAnchor;
  hideLabel?: boolean;
  firstPersonMode?: boolean;
  onSelect: (agentId: string) => void;
}

export function OfficeUnit({
  activeRoom,
  agent,
  selected,
  seatAnchor,
  hideLabel,
  firstPersonMode,
  onSelect
}: OfficeUnitProps) {
  const bodyRef = useRef<THREE.Group>(null);
  const torsoRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const walkPhase = useRef(Math.random() * Math.PI * 2);
  const visualPosition = useRef({ x: agent.position.x, y: agent.position.y });
  const trailRef = useRef<THREE.Vector3[]>([]);
  const isMovingRef = useRef(false);
  const headingRef = useRef<AgentHeading>("south");
  const baseGroupRef = useRef<THREE.Group>(null);
  
  const dimmed = activeRoom !== "all" && activeRoom !== agent.room;
  const baseOpacity = dimmed ? 0.34 : 1;

  useFrame((state, delta) => {
    // Determine movement target
    const targetX = agent.position.x;
    const targetY = agent.position.y;
    const speed = 25.0;

    const dx = targetX - visualPosition.current.x;
    const dy = targetY - visualPosition.current.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 0.05) {
      isMovingRef.current = true;
      if (Math.abs(dx) > Math.abs(dy)) {
        headingRef.current = dx >= 0 ? "east" : "west";
      } else {
        headingRef.current = dy >= 0 ? "south" : "north";
      }
      
      const step = speed * delta;
      if (step >= distance) {
        visualPosition.current.x = targetX;
        visualPosition.current.y = targetY;
        isMovingRef.current = false;
      } else {
        visualPosition.current.x += (dx / distance) * step;
        visualPosition.current.y += (dy / distance) * step;
      }
    } else {
      isMovingRef.current = false;
    }

    const floorPosition = toFloorPosition(visualPosition.current);
    const seatPosition = seatAnchor?.position;
    const isSeated = Boolean(seatAnchor) && !isMovingRef.current;
    const [x, , z] = isSeated && seatPosition ? seatPosition : floorPosition;

    if (baseGroupRef.current) {
      baseGroupRef.current.position.set(x, 0, z);
    }
    
    // Update body animations
    const rotationY = isSeated && seatAnchor ? seatAnchor.rotation : headingToRotation(headingRef.current);
    if (bodyRef.current) {
      bodyRef.current.rotation.set(0, rotationY, 0);
    }

    const time = state.clock.elapsedTime + walkPhase.current;
    const walkSwing = isMovingRef.current && !isSeated ? Math.sin(time * 8) * 0.6 : 0;

    if (bodyRef.current) {
      const bob = isMovingRef.current && !isSeated ? Math.sin(time * 8) * 0.04 : 0;
      bodyRef.current.position.y = isSeated ? 0.08 : 0.32 + bob;
    }

    if (torsoRef.current) {
      torsoRef.current.rotation.z = isSeated ? -0.12 : 0;
      torsoRef.current.position.y = isSeated ? -0.05 : 0;
    }

    if (headRef.current) {
      if (isSeated) {
        headRef.current.rotation.y = -0.2 + Math.sin(time * 2) * 0.1;
        headRef.current.rotation.z = Math.sin(time * 1.5) * 0.05;
      } else {
        headRef.current.rotation.y = Math.sin(time * 3) * 0.15;
        headRef.current.rotation.z = isMovingRef.current ? Math.sin(time * 8) * 0.05 : 0;
      }
    }

    if (leftArmRef.current && rightArmRef.current) {
      if (isSeated) {
        leftArmRef.current.rotation.z = 1.05;
        rightArmRef.current.rotation.z = 1.05;
        leftArmRef.current.rotation.x = 0.4 + Math.sin(time * 24) * 0.3;
        rightArmRef.current.rotation.x = -0.4 - Math.cos(time * 24) * 0.3;
      } else {
        leftArmRef.current.rotation.z = walkSwing;
        rightArmRef.current.rotation.z = -walkSwing;
        leftArmRef.current.rotation.x = 0;
        rightArmRef.current.rotation.x = 0;
      }
    }

    if (leftLegRef.current && rightLegRef.current) {
      if (isSeated) {
        leftLegRef.current.rotation.z = 1.35;
        rightLegRef.current.rotation.z = 1.35;
        leftLegRef.current.position.set(0.12, 0.05, 0.1);
        rightLegRef.current.position.set(0.12, 0.05, -0.1);
      } else {
        leftLegRef.current.rotation.z = -walkSwing * 0.8;
        rightLegRef.current.rotation.z = walkSwing * 0.8;
        leftLegRef.current.position.set(0, 0.05, 0.1);
        rightLegRef.current.position.set(0, 0.05, -0.1);
      }
    }

    if (ringRef.current) {
      ringRef.current.rotation.z += 0.02;
    }

    // First person view camera binding
    if (firstPersonMode && selected && headRef.current && bodyRef.current) {
      const headPos = new THREE.Vector3();
      headRef.current.getWorldPosition(headPos);

      const bodyForward = new THREE.Vector3(0, 0, 1);
      bodyRef.current.getWorldDirection(bodyForward);

      // Camera sits right at eye level
      const eyePos = headPos.clone().add(new THREE.Vector3(0, 0.4, 0)); 
      
      // Interpolate camera to the eye position
      state.camera.position.lerp(eyePos, 0.2);

      // Determine look-at target
      const lookTarget = eyePos.clone().add(bodyForward.multiplyScalar(5));
      if (isSeated) {
        lookTarget.y -= 1.0; 
      } else {
        lookTarget.y -= 0.2; 
      }
      
      state.camera.lookAt(lookTarget);
    }
  });

  const shouldShowLabel = agent.style.label && agent.style.label.length > 0;

  return (
    <group ref={baseGroupRef}>
      <mesh geometry={geoShadow} position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <meshBasicMaterial color="#150b07" opacity={0.22 * baseOpacity} transparent />
      </mesh>

      {selected ? (
        <mesh ref={ringRef} geometry={geoRing} position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <meshBasicMaterial color={agent.style.accent} opacity={0.95} transparent />
        </mesh>
      ) : null}

      <group
        ref={bodyRef}
        onClick={() => onSelect(agent.id)}
        onPointerDown={(event) => event.stopPropagation()}
      >
        <group ref={torsoRef}>
          {/* Main Torso */}
          <mesh geometry={geoTorso} castShadow position={[0, 0.35, 0]}>
            <meshStandardMaterial color={agent.style.body} opacity={baseOpacity} roughness={0.2} metalness={0.1} transparent />
          </mesh>

          {/* Collar/Neck */}
          <mesh geometry={geoCollar} castShadow position={[0, 0.65, 0]}>
            <meshStandardMaterial color={agent.style.accent} opacity={baseOpacity} roughness={0.4} metalness={0.2} transparent />
          </mesh>

          {/* Head Group */}
          <group ref={headRef} position={[0, 0.9, 0]}>
             <mesh geometry={geoHead} castShadow>
               <meshStandardMaterial color={agent.style.skin} opacity={baseOpacity} roughness={0.3} metalness={0.1} transparent />
             </mesh>
             {/* Glowing Visor */}
             <mesh geometry={geoVisor} castShadow position={[0.22, 0, 0]}>
               <meshStandardMaterial color="#cffafe" emissive="#0ea5e9" emissiveIntensity={1.2} roughness={0.1} metalness={0.6} opacity={0.9 * baseOpacity} transparent />
             </mesh>
             {/* Headphones (Ears) */}
             <mesh geometry={geoEar} castShadow position={[0, 0, 0.24]} rotation={[Math.PI/2, 0, 0]}>
               <meshStandardMaterial color={agent.style.accent} opacity={baseOpacity} roughness={0.3} metalness={0.5} transparent />
             </mesh>
             <mesh geometry={geoEar} castShadow position={[0, 0, -0.24]} rotation={[Math.PI/2, 0, 0]}>
               <meshStandardMaterial color={agent.style.accent} opacity={baseOpacity} roughness={0.3} metalness={0.5} transparent />
             </mesh>
          </group>

          {/* Left Arm */}
          <group ref={leftArmRef} position={[0, 0.5, 0.26]}>
            <mesh geometry={geoArm} castShadow position={[0, -0.15, 0]}>
              <meshStandardMaterial color={agent.style.body} opacity={baseOpacity} roughness={0.2} metalness={0.1} transparent />
            </mesh>
            <mesh geometry={geoHand} castShadow position={[0, -0.32, 0]}>
              <meshStandardMaterial color={agent.style.skin} opacity={baseOpacity} roughness={0.3} metalness={0.1} transparent />
            </mesh>
          </group>

          {/* Right Arm */}
          <group ref={rightArmRef} position={[0, 0.5, -0.26]}>
            <mesh geometry={geoArm} castShadow position={[0, -0.15, 0]}>
              <meshStandardMaterial color={agent.style.body} opacity={baseOpacity} roughness={0.2} metalness={0.1} transparent />
            </mesh>
            <mesh geometry={geoHand} castShadow position={[0, -0.32, 0]}>
              <meshStandardMaterial color={agent.style.skin} opacity={baseOpacity} roughness={0.3} metalness={0.1} transparent />
            </mesh>
          </group>

          {/* Left Leg */}
          <group ref={leftLegRef} position={[0, 0.05, 0.1]}>
            <mesh geometry={geoLeg} castShadow position={[0, -0.1, 0]}>
               <meshStandardMaterial color="#1e293b" opacity={baseOpacity} roughness={0.5} transparent />
            </mesh>
            <mesh geometry={geoFoot} castShadow position={[0.04, -0.24, 0]} rotation={[0, 0, Math.PI/2]}>
               <meshStandardMaterial color="#0f172a" opacity={baseOpacity} roughness={0.5} transparent />
            </mesh>
          </group>

          {/* Right Leg */}
          <group ref={rightLegRef} position={[0, 0.05, -0.1]}>
            <mesh geometry={geoLeg} castShadow position={[0, -0.1, 0]}>
               <meshStandardMaterial color="#1e293b" opacity={baseOpacity} roughness={0.5} transparent />
            </mesh>
            <mesh geometry={geoFoot} castShadow position={[0.04, -0.24, 0]} rotation={[0, 0, Math.PI/2]}>
               <meshStandardMaterial color="#0f172a" opacity={baseOpacity} roughness={0.5} transparent />
            </mesh>
          </group>
        </group>
      </group>

      {!hideLabel && (selected || shouldShowLabel) ? (
        <Html center distanceFactor={11} position={[0.14, Boolean(seatAnchor) && !isMovingRef.current ? 1.44 : 1.86, 0]} sprite transform>
          <button
            className={`${styles.unitLabel} ${selected ? styles.unitLabelSelected : ""} ${
              dimmed ? styles.unitLabelMuted : ""
            }`}
            onClick={() => onSelect(agent.id)}
            type="button"
          >
            <strong>{agent.name}</strong>
            {selected ? (
              <span>
                {`${roomDisplayNames[agent.room]} / ${
                  Boolean(seatAnchor) && !isMovingRef.current ? "working at desk" : isMovingRef.current ? "moving" : agent.action
                }`}
              </span>
            ) : shouldShowLabel ? (
              <span>{agent.style.label}</span>
            ) : null}
          </button>
        </Html>
      ) : null}
    </group>
  );
}
