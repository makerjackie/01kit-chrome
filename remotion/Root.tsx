import { Composition } from "remotion";
import { DemoVideo, demoDurationFrames } from "./PromoVideo";

const videoConfig = {
  fps: 30,
  width: 1920,
  height: 1080
};

export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="01KitVideoZh"
        component={DemoVideo}
        durationInFrames={demoDurationFrames}
        defaultProps={{ locale: "zh" }}
        {...videoConfig}
      />
      <Composition
        id="01KitVideoEn"
        component={DemoVideo}
        durationInFrames={demoDurationFrames}
        defaultProps={{ locale: "en" }}
        {...videoConfig}
      />
    </>
  );
};
