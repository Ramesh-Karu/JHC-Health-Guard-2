import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';

export const isNative = Capacitor.isNativePlatform();

export const requestCameraPermissions = async () => {
  if (isNative) {
    try {
      const permissions = await Camera.checkPermissions();
      if (permissions.camera !== 'granted') {
        const request = await Camera.requestPermissions();
        return request.camera === 'granted';
      }
      return true;
    } catch (e) {
      console.error('Error requesting camera permissions:', e);
      return false;
    }
  }
  return true;
};

export const takePhoto = async () => {
  try {
    if (isNative) {
      const permissions = await Camera.checkPermissions();
      if (permissions.camera !== 'granted' || permissions.photos !== 'granted') {
        const request = await Camera.requestPermissions();
        if (request.camera !== 'granted') {
          throw new Error('Camera permission denied');
        }
      }
    }

    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: CameraResultType.Base64,
      source: CameraSource.Prompt,
    });

    if (image.base64String) {
      const byteString = atob(image.base64String);
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      const blob = new Blob([ab], { type: `image/${image.format}` });
      const file = new File([blob], `photo.${image.format}`, { type: `image/${image.format}` });
      const dataUrl = `data:image/${image.format};base64,${image.base64String}`;
      
      return { file, dataUrl };
    }
    return null;
  } catch (error) {
    console.error('Error taking photo:', error);
    return null;
  }
};
