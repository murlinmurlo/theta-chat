import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Box, Typography, CircularProgress, IconButton, Avatar } from '@mui/material';
import { Close, CameraAlt } from '@mui/icons-material';

interface AvatarUploadProps {
    currentAvatar: string;
    onAvatarUpload: (file: File) => void;
    isUploading: boolean;
    username: string;
}

/**
 * Компонент для загрузки и отображения аватара пользователя
 */
const AvatarUpload: React.FC<AvatarUploadProps> = ({ 
    currentAvatar, 
    onAvatarUpload, 
    isUploading, 
    username 
}) => {
    const [isHovered, setIsHovered] = useState(false);

    // Загрузка файла аватара
    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles && acceptedFiles.length > 0) {
            const file = acceptedFiles[0];
            onAvatarUpload(file);
        }
    }, [onAvatarUpload]);

    const { getRootProps, getInputProps } = useDropzone({
        onDrop,
        maxFiles: 1,
        maxSize: 5 * 1024 * 1024, // 5MB лимит для аватара
        accept: {
            'image/*': ['.jpeg', '.jpg', '.png', '.gif']
        }
    });

    /**
     * Генерирует цвет для аватара
     */
    const stringToColor = (string: string) => {
        let hash = 0;
        for (let i = 0; i < string.length; i++) {
            hash = string.charCodeAt(i) + ((hash << 5) - hash);
        }
        let color = '#';
        for (let i = 0; i < 3; i++) {
            const value = (hash >> (i * 8)) & 0xff;
            color += `00${value.toString(16)}`.slice(-2);
        }
        return color;
    };

    /**
     * Компонент с инициалами
     */
    const stringAvatar = (name: string, size: number = 64) => {
        return {
            sx: {
                bgcolor: stringToColor(name),
                width: size,
                height: size,
                fontSize: size * 0.4,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                '&:hover': {
                    transform: 'scale(1.05)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                }
            },
            children: `${name.split(' ')[0][0]}${name.split(' ')[1] ? name.split(' ')[1][0] : ''}`,
        };
    };

    return (
        <Box
            {...getRootProps()}
            sx={{
                position: 'relative',
                display: 'inline-block',
                cursor: 'pointer',
                '&:hover .avatar-overlay': {
                    opacity: 1
                }
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <input {...getInputProps()} />
            
            {/* Отображение текущего аватара или инициалов */}
            {currentAvatar ? (
                <Avatar
                    src={currentAvatar}
                    sx={{
                        width: 64,
                        height: 64,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                            transform: 'scale(1.05)',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                        }
                    }}
                />
            ) : (
                <Avatar {...stringAvatar(username, 64)} />
            )}
            
            {/* Наложение при наведении с иконкой камеры*/}
            <Box
                className="avatar-overlay"
                sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: isHovered ? 1 : 0,
                    transition: 'opacity 0.2s ease',
                    color: 'white'
                }}
            >
                {isUploading ? (
                    <CircularProgress size={24} sx={{ color: 'white' }} />
                ) : (
                    <CameraAlt />
                )}
            </Box>
        </Box>
    );
};

export default AvatarUpload;