declare module "jsmediatags/dist/jsmediatags.min.js" {
  export interface TagType {
    title?: string;
    artist?: string;
    album?: string;
    year?: string;
    genre?: string;
    [key: string]: any;
  }

  export interface TagResult {
    tags: TagType;
  }

  export interface TagError {
    info: string;
    type: string;
  }

  export function read(
    file: string | Blob,
    callbacks: {
      onSuccess: (tag: TagResult) => void;
      onError: (error: TagError) => void;
    }
  ): void;

  const jsmediatags: {
    read: typeof read;
  };

  export default jsmediatags;
}
