'use client'

import { useState, useRef, useCallback, memo } from 'react'
import { 
  Camera, 
  Plus, 
  X, 
  Upload, 
  Image as ImageIcon,
  Maximize2,
  Trash2,
  Loader
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Photo } from '@/lib/types'

interface PhotoGalleryOptimizedProps {
  photos: Photo[]
  onPhotoAdd: (files: FileList) => Promise<void>
  onPhotoDelete: (photoId: string) => void
  className?: string
}

// 写真カードコンポーネント
const PhotoCard = memo(({ 
  photo, 
  onDelete, 
  onPreview 
}: { 
  photo: Photo
  onDelete: () => void
  onPreview: () => void
}) => (
  <div className="relative group">
    <div className="aspect-square rounded-lg overflow-hidden bg-black/20 border border-lime-400/20 hover:border-lime-400/40 transition-all">
      {photo.url ? (
        <img 
          src={photo.url} 
          alt={photo.caption || '写真'} 
          className="w-full h-full object-cover cursor-pointer transition-transform hover:scale-105"
          onClick={onPreview}
          loading="lazy"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-lime-400/40">
          <Camera className="h-8 w-8" />
        </div>
      )}
      
      {/* オーバーレイアクション */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="absolute bottom-2 right-2 flex gap-1">
          <button 
            onClick={onPreview}
            className="p-1.5 bg-white/20 backdrop-blur-sm rounded-md text-white hover:bg-white/30 transition-all"
            title="拡大表示"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
          <button 
            onClick={(e) => {
              e.stopPropagation()
              if (confirm('この写真を削除してもよろしいですか？')) {
                onDelete()
              }
            }}
            className="p-1.5 bg-red-500/20 backdrop-blur-sm rounded-md text-red-400 hover:bg-red-500/30 transition-all"
            title="削除"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
    
    {photo.caption && (
      <p className="text-xs text-lime-400/60 mt-2 truncate" title={photo.caption}>
        {photo.caption}
      </p>
    )}
  </div>
))

PhotoCard.displayName = 'PhotoCard'

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

const PhotoGalleryOptimized = memo(({
  photos,
  onPhotoAdd,
  onPhotoDelete,
  className = ''
}: PhotoGalleryOptimizedProps) => {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [previewPhoto, setPreviewPhoto] = useState<Photo | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ドラッグイベントハンドラー
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

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

  // 写真削除ハンドラー
  const handleDelete = useCallback((photoId: string) => {
    onPhotoDelete(photoId)
  }, [onPhotoDelete])

  // プレビュー表示ハンドラー
  const handlePreview = useCallback((photo: Photo) => {
    setPreviewPhoto(photo)
  }, [])

  return (
    <>
      <div className={`${className}`}>
        {/* アップロードエリア */}
        <div
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className={`
            relative mb-4 p-8 rounded-xl border-2 border-dashed transition-all
            ${isDragging 
              ? 'border-lime-400 bg-lime-400/10' 
              : 'border-lime-400/30 hover:border-lime-400/50 bg-black/20'
            }
            ${isUploading ? 'opacity-50 pointer-events-none' : ''}
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <div className="text-center">
            {isUploading ? (
              <>
                <Loader className="h-10 w-10 text-lime-400 mx-auto mb-3 animate-spin" />
                <p className="text-sm text-lime-400/80">アップロード中...</p>
              </>
            ) : (
              <>
                <Upload className="h-10 w-10 text-lime-400/60 mx-auto mb-3" />
                <p className="text-sm text-white/80 mb-2">
                  ドラッグ&ドロップまたはクリックして写真を追加
                </p>
                <Button
                  size="sm"
                  className="btn-lime"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  写真を選択
                </Button>
              </>
            )}
          </div>
        </div>

        {/* 写真グリッド */}
        {photos && photos.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {photos.map((photo) => (
              <PhotoCard
                key={photo.id}
                photo={photo}
                onDelete={() => handleDelete(photo.id)}
                onPreview={() => handlePreview(photo)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <ImageIcon className="h-12 w-12 text-lime-400/30 mx-auto mb-3" />
            <p className="text-white/40 text-sm">まだ写真がありません</p>
            <p className="text-white/30 text-xs mt-1">上のエリアから写真を追加してください</p>
          </div>
        )}
      </div>

      {/* プレビューモーダル */}
      <PhotoPreviewModal
        photo={previewPhoto}
        onClose={() => setPreviewPhoto(null)}
      />
    </>
  )
})

PhotoGalleryOptimized.displayName = 'PhotoGalleryOptimized'

export default PhotoGalleryOptimized