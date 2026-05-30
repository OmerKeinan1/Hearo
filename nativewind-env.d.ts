/// <reference types="nativewind/types" />

declare module "*.css";

declare module "*.svg" {
  import React from "react";
  import { SvgProps } from "react-native-svg";
  const content: React.FC<SvgProps>;
  export default content;
}

declare module "*.mp3" {
  // RN's asset registry returns a numeric module ID for bundled media.
  const id: number;
  export default id;
}

declare module "*.png" {
  const id: number;
  export default id;
}

declare module "*.jpg" {
  const id: number;
  export default id;
}
