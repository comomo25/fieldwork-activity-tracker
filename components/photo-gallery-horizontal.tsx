'use client'

import { useState, useRef, useCallback, memo } from 'react'
import { 
  Camera, 
  Plus, 
  X, 
  Upload, 
  Maximize2,
  Trash2,
  Loader
} from 'lucide-react'
import { Photo } from '@/lib/types'

interface PhotoGalleryHorizontalProps {
  photos: Photo[]
  onPhotoAdd: (files: FileList) => Promise<void>
  onPhotoDelete: (photoId: string) => void
  className?: string
}

// 写真プレビューモーダル
const PhotoPreviewModal = memo(({ 
  photo, 
  onClose 
}: { 
  photo: Photo | null
  onClose: () => void
}) => {
  if (!photo) return null

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 bg-white/10 rounded-full text-white hover:bg-white/20 transition-all"
      >
        <X className="h-6 w-6" />
      </button>
      
      <div className="max-w-5xl max-h-[90vh] relative">
        <img
          src={photo.url!}
          alt={photo.caption || '写真'}
          className="max-w-full max-h-full object-contain rounded-lg"
          onClick={(e) => e.stopPropagation()}
        />
        {photo.caption && (
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
            <p className="text-white text-sm">{photo.caption}</p>
          </div>
        )}
      </div>
    </div>
  )
})

PhotoPreviewModal.displayName = 'PhotoPreviewModal'

const PhotoGalleryHorizontal = memo(({
  photos,
  onPhotoAdd,
  onPhotoDelete,
  className = ''
}: PhotoGalleryHorizontalProps) => {
  const [isUploading, setIsUploading] = useState(false)
  const [previewPhoto, setPreviewPhoto] = useState<Photo | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ファイル選択ハンドラー
  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setIsUploading(true)
      try {
        await onPhotoAdd(e.target.files)
      } finally {
        setIsUploading(false)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      }
    }
  }, [onPhotoAdd])

  // ドラッグ&ドロップハンドラー
  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
      setIsUploading(true)
      try {
        await onPhotoAdd(files)
      } finally {
        setIsUploading(false)
      }
    }
  }, [onPhotoAdd])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  return (
    <>
      <div className={`${className} h-full`}>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        
        {/* 横スクロールギャラリー */}
        <div className="flex gap-3 overflow-x-auto pb-2 h-full items-center">
          {/* 追加ボタン（最初に配置） */}
          <div 
            className="flex-shrink-0"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="w-32 h-32 rounded-lg border-2 border-dashed border-lime-400/30 hover:border-lime-400/50 bg-black/20 hover:bg-black/30 transition-all flex flex-col items-center justify-center gap-2 group"
            >
              {isUploading ? (
                <>
                  <Loader className="h-8 w-8 text-lime-400 animate-spin" />
                  <span className="text-xs text-lime-400/60">追加中...</span>
                </>
              ) : (
                <>
                  <Plus className="h-8 w-8 text-lime-400/60 group-hover:text-lime-400/80 transition-colors" />
                  <span className="text-xs text-lime-400/60 group-hover:text-lime-400/80">写真を追加</span>
                </>
              )}
            </button>
          </div>

          {/* 写真リスト */}
          {photos.map((photo) => (
            <div key={photo.id} className="flex-shrink-0 relative group">
              <div className="w-32 h-32 rounded-lg overflow-hidden bg-black/20 border border-lime-400/20 hover:border-lime-400/40 transition-all">
                {photo.url ? (
                  <img 
                    src={photo.url} 
                    alt={photo.caption || '写真'} 
                    className="w-full h-full object-cover cursor-pointer transition-transform hover:scale-105"
                    onClick={() => setPreviewPhoto(photo)}
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-lime-400/40">
                    <Camera className="h-6 w-6" />
                  </div>
                )}
                
                {/* オーバーレイアクション */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <div className="absolute bottom-2 right-2 flex gap-1 pointer-events-auto">
                    <button 
                      onClick={() => setPreviewPhoto(photo)}
                      className="p-1.5 bg-white/20 backdrop-blur-sm rounded-md text-white hover:bg-white/30 transition-all"
                      title="拡大表示"
                    >
                      <Maximize2 className="h-3 w-3" />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation()
                        if (confirm('この写真を削除してもよろしいですか？')) {
                          onPhotoDelete(photo.id)
                        }
                      }}
                      className="p-1.5 bg-red-500/20 backdrop-blur-sm rounded-md text-red-400 hover:bg-red-500/30 transition-all"
                      title="削除"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* 写真がない場合のメッセージ */}
          {photos.length === 0 && !isUploading && (
            <div className="flex items-center justify-center text-white/40 text-sm px-8">
              <p>まだ写真がありません</p>
            </div>
          )}
        </div>
      </div>

      {/* プレビューモーダル */}
      <PhotoPreviewModal
        photo={previewPhoto}
        onClose={() => setPreviewPhoto(null)}
      />
    </>
  )
})

PhotoGalleryHorizontal.displayName = 'PhotoGalleryHorizontal'

export default PhotoGalleryHorizontal