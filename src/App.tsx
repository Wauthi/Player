import { useState, useRef, useEffect, useCallback } from "react";
import "./App.css";
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume,
  Volume1,
  Volume2,
  VolumeX,
  Shuffle,
  Repeat,
  Heart,
  Repeat1,
  ChevronLeft,
  X,
} from "lucide-react";
import { songs } from "./lib/songs";

export default function Player() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [shuffle, setShuffle] = useState(false);
  const [likedSongs, setLikedSongs] = useState<Set<number>>(new Set());
  const [repeat, setRepeat] = useState<"off" | "one" | "all">("off");
  const [isQueueOpen, setIsQueueOpen] = useState(false); // ✅ NEW
  const [volume, setVolumeState] = useState(1);
  const audioRef = useRef<HTMLAudioElement>(null);
  const currentSong = songs[currentIndex];

  const [bounceAnimation, setBounceAnimation] = useState(true);
  useEffect(() => {
    if (!isPlaying) {
      setBounceAnimation(true);
      const timer = setTimeout(() => setBounceAnimation(false), 7500);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  };

  const toggleLike = () => {
    setLikedSongs((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(currentIndex)) {
        newSet.delete(currentIndex);
      } else {
        newSet.add(currentIndex);
      }
      return newSet;
    });
  };

  const cycleRepeat = () => {
    setRepeat((prev) => {
      if (prev === "off") return "all";
      if (prev === "all") return "one";
      return "off";
    });
  };

  const getRandomIndex = useCallback((excludeIndex: number) => {
    if (songs.length === 1) return excludeIndex;
    let randomIndex = excludeIndex;
    while (randomIndex === excludeIndex) {
      randomIndex = Math.floor(Math.random() * songs.length);
    }
    return randomIndex;
  }, []);

  const handleNext = useCallback(() => {
    if (repeat === "one") {
      if (audioRef.current) audioRef.current.currentTime = 0;
      audioRef.current?.play();
      setIsPlaying(true);
      return;
    }

    if (shuffle) {
      setCurrentIndex((i) => {
        const next = getRandomIndex(i);
        setIsPlaying(true);
        return next;
      });
      return;
    }

    setCurrentIndex((i) => {
      const isLast = i === songs.length - 1;

      if (isLast) {
        if (repeat === "all") {
          setIsPlaying(true);
          return 0;
        } else if (repeat === "off") {
          setIsPlaying(false);
          return i;
        }
      }

      setIsPlaying(true);
      return i + 1;
    });
  }, [repeat, shuffle, getRandomIndex]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateProgress = () => {
      const value = (audio.currentTime / audio.duration) * 100;
      setProgress(isNaN(value) ? 0 : value);
    };

    const setAudioDuration = () => {
      setDuration(audio.duration);
    };

    const onEnded = () => {
      handleNext();
    };

    audio.addEventListener("timeupdate", updateProgress);
    audio.addEventListener("loadedmetadata", setAudioDuration);
    audio.addEventListener("ended", onEnded);

    if (isPlaying) {
      audio.play();
    }

    return () => {
      audio.removeEventListener("timeupdate", updateProgress);
      audio.removeEventListener("loadedmetadata", setAudioDuration);
      audio.removeEventListener("ended", onEnded);
    };
  }, [currentIndex, isPlaying, handleNext]);

  const handleSeek = (percentage: number) => {
    if (!audioRef.current || isNaN(duration)) return;
    audioRef.current.currentTime = (percentage / 100) * duration;
    setProgress(percentage);
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newProgress = parseFloat(e.target.value);
    handleSeek(newProgress);
  };

  const handlePrev = () => {
    if (shuffle) {
      setCurrentIndex((i) => getRandomIndex(i));
    } else {
      setCurrentIndex((i) => (i - 1 + songs.length) % songs.length);
    }
  };

  const toggleMute = () => {
    const newVolume = volume === 0 ? 1 : 0;
    setVolumeState(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  useEffect(() => {
    if (!audioRef.current) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    const audio = audioRef.current;

    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);

    return () => {
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
    };
  }, []);

  const renderVolumeIcon = () => {
    if (volume === 0)
      return (
        <VolumeX size={20} onClick={toggleMute} className="cursor-pointer" />
      );
    if (volume <= 0.33)
      return (
        <Volume size={20} onClick={toggleMute} className="cursor-pointer" />
      );
    if (volume <= 0.66)
      return (
        <Volume1 size={20} onClick={toggleMute} className="cursor-pointer" />
      );
    return (
      <Volume2 size={20} onClick={toggleMute} className="cursor-pointer" />
    );
  };

  // Touch gesture handlers
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const distance = touchStartX.current - touchEndX.current;
    if (distance > 70) {
      setIsQueueOpen(true);
    } else if (distance < -70) {
      setIsQueueOpen(false);
    }
  };

  return (
    <div
      className="caret-transparent flex flex-col md:flex-row h-screen overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}>
      {/* Mobile Queue Toggle Button */}
      {!isQueueOpen && (
        <button
          className={`cursor-pointer fixed right-4 top-1/2 -translate-y-1/2 z-50 flex flex-col items-center gap-1 -rotate-90 text-red-900 font-bold px-3 py-2 rounded-full ${
            bounceAnimation ? "animate-bounce" : ""
          } sm:hidden hover:text-red-600 hover:scale-110 transition-transform duration-200`}
          onClick={() => setIsQueueOpen(true)}>
          <ChevronLeft className="w-5 h-5 -rotate-270" />
          {/* <span className="tracking-widest">Queue </span> */}
        </button>
      )}

      {/*Mobile Slide-In Queue */}
      <div
        className={`fixed top-0 bottom-0 right-0 w-3/4 sm:hidden bg-gradient-to-br from-yellow-100 via-red-200 to-red-400 text-red-900 p-6 border-l border-red-900 rounded-l-2xl shadow-2xl z-50 transform transition-transform duration-300 ${
          isQueueOpen ? "translate-x-0" : "translate-x-full"
        }`}>
        <div className="relative w-full flex justify-between items-center mb-6 border-b border-red-300 pb-1">
          <h2 className="cursor-default text-xl font-bold tracking-wide">
            Queue
          </h2>
          <button
            onClick={() => setIsQueueOpen(false)}
            className=" text-red-900 font-bold cursor-pointer hover:text-red-600 hover:scale-110 transition-transform duration-200">
            <X size={24} />
          </button>
        </div>
        <ul className="space-y-3 h-full overflow-y-auto pr-2">
          {songs.map((song, index) => (
            <li
              key={index}
              onClick={() => {
                setCurrentIndex(index);
                setTimeout(() => {
                  audioRef.current?.play();
                }, 100);
                setIsQueueOpen(false);
              }}
              className={`p-3 rounded-lg transition-all duration-300 cursor-pointer ${
                index === currentIndex
                  ? "bg-yellow-400 text-black font-semibold shadow-md"
                  : "bg-white/20 hover:bg-white/70"
              }`}>
              <div className="text-sm tracking-wide">
                {song.title}
              </div>
              <div className="text-xs text-red-700">{song.artist}</div>
            </li>
          ))}
        </ul>
      </div>

      {/*Desktop Queue */}
      <div className="hidden md:flex md:w-1/2 flex-col justify-between bg-gradient-to-br from-yellow-100 via-red-200 to-red-400 text-red-900 p-6 border-red-900 rounded-2xl shadow-2xl">
        <div className="z-10 relative mb-6 flex-1 overflow-hidden">
          <h2 className="text-2xl font-bold tracking-wide mb-4 border-b border-red-300 pb-2">
            Queue
          </h2>
          <ul className="space-y-3 h-full overflow-y-auto pr-2">
            {songs.map((song, index) => (
              <li
                key={index}
                onClick={() => {
                  setCurrentIndex(index);
                  setTimeout(() => {
                    audioRef.current?.play();
                  }, 100);
                }}
                className={`p-3 rounded-lg transition-all duration-300 cursor-pointer ${
                  index === currentIndex
                    ? "bg-yellow-400 text-black font-semibold shadow-md"
                    : "bg-white/20 hover:bg-white/70"
                }`}>
                <div className="text-sm tracking-wide">
                  {song.title}
                </div>
                <div className="text-xs text-red-700">{song.artist}</div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Player */}
      <div className="w-full md:w-1/2 h-screen p-6 flex flex-col justify-start bg-white shadow-2xl rounded-none overflow-hidden">
        <div className="p-4 md:p-2 lg:p-4 text-center text-red-900 text-xl font-bold tracking-wide border-b pb-4 mb-4 border-red-300 min-h-[3.5rem] transition-all duration-500 ease-in-out">
          <div className="relative h-12 overflow-hidden">
            <div
              className={`absolute inset-0 flex flex-col items-center justify-center transition-all duration-500 ease-in-out ${
                isPlaying
                  ? "-translate-y-full opacity-0"
                  : "translate-y-0 opacity-100"
              }`}>
              <div className="text-red-900 font-bold text-xl cursor-default">
                Doba Player
              </div>
              <div className="text-base text-red-700 font-semibold cursor-default">
                {currentSong.artist}
              </div>
            </div>
            <div
              className={`absolute inset-0 flex flex-col items-center justify-center transition-all duration-500 ease-in-out ${
                isPlaying
                  ? "translate-y-0 opacity-100"
                  : "translate-y-full opacity-0"
              }`}>
              <div className="text-red-900 font-bold text-xl cursor-default">
                Now Playing:
              </div>
              <div className="text-base text-red-700 font-semibold cursor-default">
                {currentSong.title}
              </div>
            </div>
          </div>
        </div>

        <div
          className={`p-4 md:p-8 lg:p-6 w-40 h-40 mx-auto rounded-full border-8 border-yellow-400 bg-red-600 flex items-center justify-center text-white text-xl font-bold shadow-inner transition-transform duration-500 ${
            isPlaying
              ? "scale-105 animate-pulse cursor-default"
              : "scale-100 cursor-default"
          }`}>
          Ngoma
        </div>
        <div className="text-center mt-6 mb-4 cursor-default">
          <div className="text-center mt-4 text-xl text-red-800 font-semibold">
            {currentSong.title}
          </div>
          <div className="text-center text-sm text-red-500 mb-4">
            {currentSong.artist}
          </div>
        </div>

        <div className="flex justify-center items-center gap-1 mb-2">
          {Array.from({ length: 20 }).map((_, i) => {
            const beadPercentage = (i + 1) * 5;
            return (
              <div
                key={i}
                onClick={() => handleSeek(beadPercentage)}
                className={`w-3 h-3 rounded-full cursor-pointer ${
                  progress >= beadPercentage ? "bg-amber-100" : "bg-red-200"
                } transition-all duration-300 border border-yellow-900 shadow-sm`}
              />
            );
          })}
        </div>

        <div className="flex justify-center items-center mb-6">
          <input
            type="range"
            min="0"
            max="100"
            step="0.1"
            value={progress}
            onChange={handleSliderChange}
            className="w-3/4 h-2 rounded-full bg-amber-100 appearance-none accent-yellow-200 outline-none cursor-grab"
            style={{
              background: `linear-gradient(to right, #fde68a 0%, #fde68a ${progress}%, #fcd34d ${progress}%, #fef3c7 100%)`,
              boxShadow: "inset 0 0 2px #fef3c7",
            }}
          />
        </div>

        <div className="flex flex-col items-center justify-center gap-4">
          <button
            className="border-2 border-black bg-red-800 text-white p-3 rounded-full hover:bg-red-600 shadow-md cursor-pointer"
            onClick={togglePlay}
            title="Play/Pause">
            {isPlaying ? <Pause size={24} /> : <Play size={24} />}
          </button>

          <div className="flex gap-4 items-center">
            <button
              className="text-red-800 hover:text-red-600 cursor-pointer"
              onClick={handlePrev}
              title="Previous">
              <SkipBack size={28} />
            </button>
            <button
              className={`p-2 rounded-full cursor-pointer transition-colors duration-300 ${
                shuffle
                  ? "bg-red-700 text-white hover:bg-red-800"
                  : "text-red-800 hover:text-red-600"
              }`}
              onClick={() => setShuffle(!shuffle)}
              aria-label="Toggle Shuffle"
              title="Shuffle">
              <Shuffle size={28} />
            </button>
            <button
              className={`p-2 rounded-full cursor-pointer transition-colors duration-300 ${
                likedSongs.has(currentIndex)
                  ? "bg-yellow-600 text-white hover:bg-yellow-700"
                  : "text-yellow-700 hover:text-yellow-500"
              }`}
              onClick={toggleLike}
              aria-label="Like"
              title="Like">
              <Heart size={24} />
            </button>
            <button
              className={`p-2 rounded-full cursor-pointer transition-colors duration-300 ${
                repeat !== "off"
                  ? "bg-red-700 text-white hover:bg-red-800"
                  : "text-red-800 hover:text-red-600"
              }`}
              onClick={cycleRepeat}
              aria-label="Repeat Mode"
              title={`Repeat: ${repeat}`}>
              {repeat === "one" ? (
                <Repeat1 size={24} />
              ) : (
                <Repeat
                  size={24}
                  className={repeat === "all" ? "opacity-100" : "opacity-100"}
                />
              )}
            </button>

            <button
              className="text-red-800 hover:text-red-600 cursor-pointer"
              onClick={handleNext}
              title="Next">
              <SkipForward size={28} />
            </button>
          </div>

          <div className="flex items-center gap-2 text-red-700">
            {renderVolumeIcon()}
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(e) => {
                const newVolume = parseFloat(e.target.value);
                setVolumeState(newVolume);
                if (audioRef.current) {
                  audioRef.current.volume = newVolume;
                }
              }}
              className="w-40 accent-red-700 cursor-grab"
            />
          </div>
        </div>
        <audio ref={audioRef} src={currentSong.src} preload="metadata" />
      </div>
    </div>
  );
}
