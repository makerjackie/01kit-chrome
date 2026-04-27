import { Composition, Folder } from "remotion";
import { DemoVideo, PromoVideo, demoDurationFrames, motionDurationFrames } from "./PromoVideo";

const videoConfig = {
  fps: 30,
  width: 1920,
  height: 1080
};

export const RemotionRoot = () => {
  return (
    <>
      <Folder name="Motion">
        <Composition
          id="01KitMotionZh"
          component={PromoVideo}
          durationInFrames={motionDurationFrames}
          defaultProps={{ locale: "zh" }}
          {...videoConfig}
        />
        <Composition
          id="01KitMotionEn"
          component={PromoVideo}
          durationInFrames={motionDurationFrames}
          defaultProps={{ locale: "en" }}
          {...videoConfig}
        />
      </Folder>
      <Folder name="Demo">
        <Composition
          id="01KitDemoZh"
          component={DemoVideo}
          durationInFrames={demoDurationFrames}
          defaultProps={{ locale: "zh" }}
          {...videoConfig}
        />
        <Composition
          id="01KitDemoEn"
          component={DemoVideo}
          durationInFrames={demoDurationFrames}
          defaultProps={{ locale: "en" }}
          {...videoConfig}
        />
      </Folder>
      <Composition
        id="01KitPromo"
        component={PromoVideo}
        durationInFrames={motionDurationFrames}
        defaultProps={{ locale: "zh" }}
        {...videoConfig}
      />
    </>
  );
};
