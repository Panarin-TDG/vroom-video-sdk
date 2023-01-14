export interface InitVroomOption {
  debug: string;
  callback: Function;
}

export type InitVroomHandler = (options: InitVroomOption) => void;
