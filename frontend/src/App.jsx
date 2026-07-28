import React, { useState } from 'react';
import { ChakraProvider, extendTheme, Box, Center, Text, VStack } from '@chakra-ui/react';
import ThemeSelector from './components/ThemeSelector';
import DifficultySelector from './components/DifficultySelector';
import GameInterface from './components/GameInterface';

// 自定义暗黑主题配置
const customTheme = extendTheme({
  config: {
    initialColorMode: 'dark',
    useSystemColorMode: false,
  },
  styles: {
    global: {
      body: {
        bg: 'var(--primary-dark)',
        color: 'var(--text-primary)',
        fontFamily: 'var(--font-family)',
      },
    },
  },
  colors: {
    brand: {
      50: '#e8f5e8',
      100: '#c3e6c3',
      200: '#9dd69d',
      300: '#76c676',
      400: '#4fb64f',
      500: '#00e676',
      600: '#00c965',
      700: '#00ab54',
      800: '#008d42',
      900: '#006f31',
    },
  },
});

const App = () => {
  const [gameState, setGameState] = useState('theme-selection'); // theme-selection, difficulty-selection, playing, completed
  const [selectedTheme, setSelectedTheme] = useState(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState(null);
  const [gameSession, setGameSession] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // 处理主题选择
  const handleThemeSelect = (theme) => {
    setSelectedTheme(theme);
    setGameState('difficulty-selection');
    setError(null);
  };

  // 处理难度选择和游戏开始
  const handleDifficultySelect = (difficulty, gameData) => {
    setSelectedDifficulty(difficulty);
    setGameSession(gameData);
    setGameState('playing');
    setError(null);
  };

  // 处理游戏完成
  const handleGameComplete = (result) => {
    setGameState('completed');
    // 可以在这里处理游戏结果，比如显示成绩、保存记录等
    console.log('游戏完成:', result);
  };

  // 返回主菜单
  const handleBackToMenu = () => {
    setGameState('theme-selection');
    setSelectedTheme(null);
    setSelectedDifficulty(null);
    setGameSession(null);
    setError(null);
  };

  // 返回主题选择
  const handleBackToThemes = () => {
    setGameState('theme-selection');
    setSelectedTheme(null);
    setError(null);
  };

  // 返回难度选择
  const handleBackToDifficulty = () => {
    setGameState('difficulty-selection');
    setSelectedDifficulty(null);
    setGameSession(null);
    setError(null);
  };

  // 错误处理
  const handleError = (errorMessage) => {
    setError(errorMessage);
    setIsLoading(false);
  };

  // 渲染加载状态
  const renderLoading = (message = '加载中...') => (
    <Center minH="100vh" bg="var(--primary-dark)">
      <VStack spacing={4}>
        <Spinner 
          thickness="3px"
          speed="0.65s"
          emptyColor="var(--secondary-dark)"
          color="var(--neon-green)"
          size="xl"
        />
        <Text color="var(--text-secondary)" fontSize="lg">
          {message}
        </Text>
      </VStack>
    </Center>
  );

  // 渲染错误状态
  const renderError = () => (
    <Center minH="100vh" bg="var(--primary-dark)">
      <VStack spacing={4} textAlign="center">
        <Text color="var(--blood-red)" fontSize="xl" fontWeight="bold">
          ⚠️ 出现错误
        </Text>
        <Text color="var(--text-secondary)" fontSize="md" maxW="400px">
          {error}
        </Text>
        <button
          className="btn btn-primary"
          onClick={handleBackToMenu}
          style={{
            background: 'var(--neon-green)',
            color: 'var(--primary-dark)',
            padding: '12px 24px',
            borderRadius: '8px',
            border: 'none',
            fontSize: '16px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
        >
          返回主菜单
        </button>
      </VStack>
    </Center>
  );

  // 主渲染逻辑
  const renderCurrentState = () => {
    if (error) {
      return renderError();
    }

    if (isLoading) {
      return renderLoading();
    }

    switch (gameState) {
      case 'theme-selection':
        return (
          <ThemeSelector 
            onThemeSelect={handleThemeSelect}
            onError={handleError}
          />
        );

      case 'difficulty-selection':
        return (
          <DifficultySelector
            selectedTheme={selectedTheme}
            onDifficultySelect={handleDifficultySelect}
            onBack={handleBackToThemes}
            onError={handleError}
          />
        );

      case 'playing':
        return (
          <GameInterface
            sessionData={gameSession}
            onGameComplete={handleGameComplete}
            onBackToMenu={handleBackToMenu}
            onError={handleError}
          />
        );

      case 'completed':
        return (
          <Center minH="100vh" bg="var(--primary-dark)">
            <VStack spacing={6} textAlign="center">
              <Text fontSize="3xl" fontWeight="bold" color="var(--neon-green)">
                🎉 恭喜完成！
              </Text>
              <Text color="var(--text-secondary)" fontSize="lg">
                你成功解开了这个海龟汤谜题！
              </Text>
              <VStack spacing={3}>
                <button
                  className="btn btn-primary"
                  onClick={handleBackToMenu}
                  style={{
                    background: 'var(--neon-green)',
                    color: 'var(--primary-dark)',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    border: 'none',
                    fontSize: '16px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    marginRight: '12px'
                  }}
                >
                  回到主菜单
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={handleBackToDifficulty}
                  style={{
                    background: 'var(--glass-bg)',
                    color: 'var(--text-primary)',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    fontSize: '16px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                >
                  再玩一次
                </button>
              </VStack>
            </VStack>
          </Center>
        );

      default:
        return renderError();
    }
  };

  return (
    <React.StrictMode>
      <ChakraProvider theme={customTheme}>
        <Box 
          className="container-full"
          minH="100vh"
          bg="var(--primary-dark)"
          backgroundImage={`
            radial-gradient(circle at 25% 25%, var(--midnight-blue) 0%, transparent 50%),
            radial-gradient(circle at 75% 75%, var(--dark-purple) 0%, transparent 50%)
          `}
          backgroundAttachment="fixed"
        >
          {/* 页面标题 - 用于SEO和浏览器标签 */}
          <title>神秘海龟汤 - AI推理游戏 - 由响指AI生成</title>
          
          {/* 主要内容区域 */}
          {renderCurrentState()}
          

        </Box>
      </ChakraProvider>
    </React.StrictMode>
  );
};

export default App;