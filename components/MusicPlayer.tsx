import { useRef, useState, useEffect } from "react";
import styles from "@/styles/Home.module.css";

const AMBIENT_TRACKS = [
  { name: "Chill Lo-Fi", url: "https://cdn.pixabay.com/audio/2022/05/27/audio_1808fbf07a.mp3" },
  { name: "Soft Piano", url: "https://cdn.pixabay.com/audio/2022/02/22/audio_d1718ab41b.mp3" },
  { name: "Coffee Shop", url: "https://cdn.pixabay.com/audio/2024/11/04/audio_57e48db0a7.mp3" },
];

export function MusicPlayer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [trackIdx, setTrackIdx] = useState(0);
  const [volume, setVolume] = useState(0.4);

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.loop = true;
      audioRef.current.volume = volume;
    }
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio.src = AMBIENT_TRACKS[trackIdx].url;
      audio.play().catch(() => {});
      setPlaying(true);
    }
  };

  const switchTrack = (idx: number) => {
    setTrackIdx(idx);
    const audio = audioRef.current;
    if (!audio) return;
    audio.src = AMBIENT_TRACKS[idx].url;
    if (playing) {
      audio.play().catch(() => {});
    }
  };

  if (!open) return null;

  return (
    <div className={styles.floatingPanel} style={{ bottom: 80, right: 20 }}>
      <div className={styles.floatingPanelHeader}>
        <span>🎵 办公室音乐</span>
        <button className={styles.drawerClose} onClick={onClose} type="button">×</button>
      </div>
      <div className={styles.musicBody}>
        <div className={styles.musicTrackList}>
          {AMBIENT_TRACKS.map((track, idx) => (
            <button
              key={track.name}
              className={`${styles.musicTrack} ${idx === trackIdx ? styles.musicTrackActive : ""}`}
              onClick={() => switchTrack(idx)}
              type="button"
            >
              <span className={styles.musicTrackDot} style={{ background: idx === trackIdx && playing ? "#7ce0ff" : "rgba(130,200,255,0.2)" }} />
              {track.name}
            </button>
          ))}
        </div>
        <div className={styles.musicControls}>
          <button className={styles.musicPlayBtn} onClick={togglePlay} type="button">
            {playing ? "⏸" : "▶️"}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className={styles.musicVolume}
          />
          <span className={styles.musicVolumeLabel}>{Math.round(volume * 100)}%</span>
        </div>
      </div>
    </div>
  );
}
