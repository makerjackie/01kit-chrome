import { Composition } from "remotion";
import { PromoVideo } from "./PromoVideo";

export const RemotionRoot = () => {
  return (
    <Composition
      id="01KitPromo"
      component={PromoVideo}
      durationInFrames={720}
      fps={30}
      width={1920}
      height={1080}
    />
  );
};
