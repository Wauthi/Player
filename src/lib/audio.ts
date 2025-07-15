let audio: HTMLAudioElement | null = null;

export const loadAndPlay = (src: string) => {
  if (audio) {
    audio.pause();
  }

  audio = new Audio(src);
  audio.volume = 1;
  audio.play();
};

export const setVolume = (value: number) => {
  if (audio) {
    audio.volume = value;
  }
};

export const getAudio = () => audio;
