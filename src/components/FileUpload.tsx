import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Box, Typography, CircularProgress, IconButton } from '@mui/material';
import { Close, CloudUpload } from '@mui/icons-material';
import { formatFileSize, isImageFile } from '../utils/fileUtils';

interface FileUploadProps {
    onFileUpload: (file: File) => void;
    onRemoveFile: () => void;
    isUploading: boolean;
}

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
        maxSize: 10 * 1024 * 1024,
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

    if (selectedFile) {
        return (
            <Box style={{ 
                padding: '10px', 
                border: '1px solid #e0e0e0', 
                borderRadius: '8px',
                marginBottom: '10px',
                background: '#f9f9f9'
            }}>
                <Box style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {isImageFile(selectedFile.type) ? (
                            <img 
                                src={URL.createObjectURL(selectedFile)} 
                                alt="Preview" 
                                style={{ 
                                    width: '40px', 
                                    height: '40px', 
                                    objectFit: 'cover',
                                    borderRadius: '4px'
                                }} 
                            />
                        ) : (
                            <Box style={{ 
                                width: '40px', 
                                height: '40px', 
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: '#e3f2fd',
                                borderRadius: '4px'
                            }}>
                                <Typography variant="body2">
                                    {selectedFile.name.split('.').pop()?.toUpperCase()}
                                </Typography>
                            </Box>
                        )}
                        <Box>
                            <Typography variant="body2" style={{ fontWeight: 'bold' }}>
                                {selectedFile.name}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
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
                {isUploading && (
                    <Box style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
                        <CircularProgress size={16} />
                        <Typography variant="caption">Загрузка...</Typography>
                    </Box>
                )}
            </Box>
        );
    }

    return (
        <Box
            {...getRootProps()}
            style={{
                border: '2px dashed',
                borderColor: isDragActive ? '#1976d2' : '#e0e0e0',
                borderRadius: '8px',
                padding: '20px',
                textAlign: 'center',
                cursor: 'pointer',
                background: isDragActive ? '#e3f2fd' : '#fafafa',
                marginBottom: '10px',
                transition: 'all 0.2s ease'
            }}
        >
            <input {...getInputProps()} />
            <CloudUpload style={{ fontSize: 48, color: '#9e9e9e', marginBottom: '10px' }} />
            <Typography variant="body1" style={{ marginBottom: '5px' }}>
                {isDragActive ? 'Отпустите файл здесь' : 'Перетащите файл сюда'}
            </Typography>
            <Typography variant="caption" color="textSecondary">
                или нажмите для выбора файла
            </Typography>
            <Typography variant="caption" color="textSecondary" style={{ display: 'block', marginTop: '5px' }}>
                Максимальный размер: 10MB
            </Typography>
        </Box>
    );
};

export default FileUpload;
