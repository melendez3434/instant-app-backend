import Constants from "expo-constants";

export const getAppid = () => {
  return Number(
    Constants.manifest?.extra?.appId ||
      window?.location?.search?.split("=")[1] ||
      1
  );
};
