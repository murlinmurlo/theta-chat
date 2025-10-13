import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Box, Typography, CircularProgress, IconButton, Paper } from '@mui/material';
import { Close, CloudUpload, InsertDriveFile, Image as ImageIcon } from '@mui/icons-material';
import { formatFileSize, isImageFile } from '../utils/fileUtils';

interface FileUploadProps {
    onFileUpload: (file: File) => void;
    onRemoveFile: () => void;
    isUploading: boolean;
}

/**
 * Компонент для загрузки файлов с drag-and-drop функциональностью
 * Поддерживает предпросмотр изображений и отображение статуса загрузки
 */
const FileUpload: React.FC<FileUploadProps> = ({ onFileUpload, onRemoveFile, isUploading }) => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles && acceptedFiles.length > 0) {
            const file = acceptedFiles[0];
            setSelectedFile(file);
            onFileUpload(file);
        }
    }, [onFileUpload]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        maxFiles: 1,
        maxSize: 10 * 1024 * 1024, // 10MB лимит
        accept: {
            'image/*': ['.jpeg', '.jpg', '.png', '.gif'],
            'application/pdf': ['.pdf'],
            'application/msword': ['.doc'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
            'text/plain': ['.txt'],
            'application/zip': ['.zip']
        }
    });

    const handleRemoveFile = () => {
        setSelectedFile(null);
        onRemoveFile();
    };

    // Предпросмотр
    if (selectedFile) {
        return (
            <Paper 
                elevation={1}
                sx={{ 
                    p: 2, 
                    mb: 2,
                    borderRadius: 2,
                    background: 'background.default'
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        {/* Предпросмотр для изображений */}
                        {isImageFile(selectedFile.type) ? (
                            <Box sx={{ 
                                width: 60, 
                                height: 60, 
                                borderRadius: 1,
                                overflow: 'hidden',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: 'action.hover'
                            }}>
                                <img 
                                    src={URL.createObjectURL(selectedFile)} 
                                    alt="Preview" 
                                    style={{ 
                                        width: '100%', 
                                        height: '100%', 
                                        objectFit: 'cover'
                                    }} 
                                />
                            </Box>
                        ) : (
                            // Иконка
                            <Box sx={{ 
                                width: 60, 
                                height: 60, 
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: 'primary.light',
                                borderRadius: 1,
                                color: 'white'
                            }}>
                                <InsertDriveFile />
                            </Box>
                        )}
                        <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                                {selectedFile.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {formatFileSize(selectedFile.size)}
                            </Typography>
                        </Box>
                    </Box>
                    <IconButton 
                        size="small" 
                        onClick={handleRemoveFile}
                        disabled={isUploading}
                    >
                        <Close />
                    </IconButton>
                </Box>
                {/* Индикатор загрузки */}
                {isUploading && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                        <CircularProgress size={16} />
                        <Typography variant="caption" color="text.secondary">
                            Загружаем файл...
                        </Typography>
                    </Box>
                )}
            </Paper>
        );
    }

    return (
        <Paper
            {...getRootProps()}
            elevation={1}
            sx={{
                border: '2px dashed',
                borderColor: isDragActive ? 'primary.main' : 'divider',
                borderRadius: 2,
                p: 3,
                textAlign: 'center',
                cursor: 'pointer',
                backgroundColor: isDragActive ? 'action.hover' : 'background.default',
                mb: 2,
                transition: 'all 0.2s ease',
                '&:hover': {
                    borderColor: 'primary.main',
                    backgroundColor: 'action.hover'
                }
            }}
        >
            <input {...getInputProps()} />
            <CloudUpload 
                sx={{ 
                    fontSize: 48, 
                    color: isDragActive ? 'primary.main' : 'text.secondary',
                    mb: 2
                }} 
            />
            <Typography variant="body1" sx={{ mb: 1, fontWeight: 500 }}>
                {isDragActive ? 'Отпустите файл здесь' : 'Перетащите файл сюда'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                или нажмите для выбора файла
            </Typography>
            <Typography variant="caption" color="text.secondary">
                Поддерживаемые форматы: JPG, PNG, GIF, PDF, DOC, ZIP (макс. 10MB)
            </Typography>
        </Paper>
    );
};

export default FileUpload;