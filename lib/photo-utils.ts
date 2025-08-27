import { Photo } from './types';

export const handlePhotoUpload = async (files: FileList): Promise<Photo[]> => {
  const photos: Photo[] = [];
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    
    // 画像ファイルのみ処理
    if (!file.type.startsWith('image/')) {
      continue;
    }
    
    // Base64に変換
    const base64 = await fileToBase64(file);
    
    // 写真オブジェクトを作成（FirebaseはDateオブジェクトを配列内で直接保存できないため、ISO文字列として保存）
    const photo: Photo = {
      id: `photo-${Date.now()}-${i}`,
      url: base64,
      caption: file.name.replace(/\.[^/.]+$/, ''), // 拡張子を除いたファイル名
      takenAt: new Date(file.lastModified).toISOString(),
    };
    
    photos.push(photo);
  }
  
  return photos;
};

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

export const deletePhoto = (photos: Photo[], photoId: string): Photo[] => {
  return photos.filter(p => p.id !== photoId);
};