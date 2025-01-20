import { useState } from 'react'
import { v4 } from 'uuid'
import { toast } from "./use-toast"
import { useUploadFileMutation } from '@/redux/api/app'

interface FileUploadReturn {
    uploading: boolean
    uploadFile: (file: File, showToast?: boolean) => Promise<string | undefined>
    getFileNameFromUrl: (url: string) => string
}

export function useFileUpload(): FileUploadReturn {
    const [uploading, setUploading] = useState(false)
    const [uploadFileApi] = useUploadFileMutation()

    const getFileNameFromUrl = (url: string): string => {
        if (!url) return ''
        const urlParts = url.split('/')
        const fullFileName = urlParts[urlParts.length - 1]
        const [timestamp, ...fileNameParts] = fullFileName.split('___')
        console.log(timestamp)
        return fileNameParts.join('___') // Return everything after the first delimiter
    }

    const uploadFile = async (file: File, showToast: boolean = true): Promise<string | undefined> => {
        setUploading(true)
        try {
            const ext = file.name.split('.').pop()
            const fileNameWithoutExt = file.name.split('.').slice(0, -1).join('.')
            // Add delimiter '___' to easily split filename later
            const filename = `${v4()}___${fileNameWithoutExt.replace(/\s+/g, '-')}.${ext}`

            // Upload file directly to backend
            await uploadFileApi({ file, filename }).unwrap()

            if (showToast) {
                toast({
                    variant: "success",
                    title: "File Upload Successful",
                    description: `The file ${file.name} has been uploaded successfully.`,
                })
            }

            return filename
        } catch (error) {
            toast({
                variant: "destructive",
                title: "File Upload Failed",
                description: `The file ${file.name} could not be uploaded. Please try again.`,
            })

            console.error('File upload error:', error)
            return undefined
        } finally {
            setUploading(false)
        }
    }

    return {
        uploading,
        uploadFile,
        getFileNameFromUrl,

    }
}
