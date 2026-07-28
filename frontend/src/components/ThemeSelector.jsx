import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Card,
  CardBody,
  Grid,
  Badge,
  Icon,
  Spinner,
  Center,
  useToast
} from '@chakra-ui/react';
import { 
  FaEye, 
  FaCity, 
  FaScroll, 
  FaRocket, 
  FaBrain, 
  FaGhost,
  FaLock,
  FaSearch,
  FaUniversity,
  FaGem,
  FaCloud,
  FaClock,
  FaArrowRight
} from 'react-icons/fa';

const ThemeSelector = ({ onThemeSelect }) => {
  const [themes, setThemes] = useState([]);
  const [selectedTheme, setSelectedTheme] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();

  // 主题数据配置 - 12种神秘主题
  const themeIcons = {
    '1': FaEye,      // 悬疑推理
    '2': FaCity,     // 都市传说
    '3': FaScroll,   // 历史谜案
    '4': FaRocket,   // 科幻奇谈
    '5': FaBrain,    // 心理惊悚
    '6': FaGhost,    // 超自然现象
    '7': FaLock,     // 密室逃脱
    '8': FaSearch,   // 犯罪心理
    '9': FaUniversity, // 古代秘辛
    '10': FaGem, // 未来预言
    '11': FaCloud,   // 梦境解析
    '12': FaClock    // 时空悖论
  };

  const themeDescriptions = {
    '1': '运用缜密逻辑，揭开层层谜团',
    '2': '探索现代都市中的诡异传说',
    '3': '追溯历史深处的未解之谜',
    '4': '穿越时空，体验未来科技之谜',
    '5': '深入人心，探索内心恐惧',
    '6': '接触超自然力量的神秘事件',
    '7': '在密闭空间中寻找逃生之路',
    '8': '分析罪犯心理，破解犯罪动机',
    '9': '发掘古代文明的隐藏秘密',
    '10': '预见未来，改变命运轨迹',
    '11': '解读潜意识中的符号密码',
    '12': '挑战时间与空间的逻辑悖论'
  };

  useEffect(() => {
    fetchThemes();
  }, []);

  const fetchThemes = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/themes');
      
      if (!response.ok) {
        throw new Error('获取主题失败');
      }
      
      const themesData = await response.json();
      setThemes(themesData);
    } catch (error) {
      console.error('获取主题失败:', error);
      toast({
        title: "加载失败",
        description: "无法获取主题列表，请刷新页面重试",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleThemeSelect = (theme) => {
    setSelectedTheme(theme);
  };

  const handleContinue = async () => {
    if (!selectedTheme) {
      toast({
        title: "请选择主题",
        description: "请先选择一个你感兴趣的主题",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // 简单延迟模拟加载过程
      await new Promise(resolve => setTimeout(resolve, 800));
      
      toast({
        title: "主题选择成功",
        description: `已选择「${selectedTheme.name}」主题`,
        status: "success",
        duration: 2000,
        isClosable: true,
      });

      onThemeSelect(selectedTheme);
    } catch (error) {
      console.error('主题选择失败:', error);
      toast({
        title: "选择失败",
        description: "主题选择失败，请重试",
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
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
            正在加载主题...
          </Text>
        </VStack>
      </Center>
    );
  }

  return (
    <Box 
      className="page-enter"
      minH="100vh" 
      bg="var(--primary-dark)" 
      p={4}
      backgroundImage={`url('https://hpi-hub.tos-cn-beijing.volces.com/static/illustration/ai-generated-9165898_1280.png')`}
      backgroundSize="cover"
      backgroundPosition="center"
      backgroundAttachment="fixed"
      _before={{
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        bg: 'rgba(18, 18, 18, 0.85)',
        zIndex: 0
      }}
    >
      <Box position="relative" zIndex={1} maxW="1200px" mx="auto" py={8}>
        {/* 标题区域 */}
        <VStack spacing={6} mb={10} textAlign="center">
          <Box>
            <Text fontSize="4xl" fontWeight="bold" mb={2} className="text-gradient">
              选择你的推理主题
            </Text>
            <Text 
              color="var(--text-secondary)" 
              fontSize="lg"
              maxW="600px"
              lineHeight="tall"
            >
              探索12种不同的神秘世界，每个主题都将带给你独特的推理挑战体验
            </Text>
          </Box>

          <HStack spacing={3}>
            <Badge colorScheme="purple" px={3} py={1} borderRadius="full">
              神秘悬疑
            </Badge>
            <Badge colorScheme="blue" px={3} py={1} borderRadius="full">
              AI智能出题
            </Badge>
            <Badge colorScheme="green" px={3} py={1} borderRadius="full">
              逻辑推理
            </Badge>
          </HStack>
        </VStack>

        {/* 主题选择网格 */}
        <Grid 
          templateColumns={{ 
            base: "repeat(1, 1fr)", 
            sm: "repeat(2, 1fr)", 
            md: "repeat(3, 1fr)", 
            lg: "repeat(4, 1fr)" 
          }} 
          gap={6} 
          mb={10}
        >
          {themes.map((theme, index) => {
            const IconComponent = themeIcons[theme.id] || FaEye;
            const isSelected = selectedTheme?.id === theme.id;
            
            return (
              <Card
                key={theme.id}
                className={`theme-card theme-card-enter ${isSelected ? 'selected' : ''}`}
                bg="var(--glass-bg)"
                borderColor={isSelected ? "var(--border-accent)" : "var(--border-color)"}
                borderWidth="2px"
                cursor="pointer"
                onClick={() => handleThemeSelect(theme)}
                transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                _hover={{
                  transform: "translateY(-8px)",
                  borderColor: "var(--border-accent)",
                  boxShadow: "var(--shadow-lg)"
                }}
                style={{
                  animationDelay: `${index * 0.1}s`
                }}
              >
                <CardBody p={6}>
                  <VStack spacing={4} align="center" textAlign="center">
                    {/* 主题图标 */}
                    <Box
                      p={4}
                      borderRadius="xl"
                      background={theme.background || 'var(--midnight-blue)'}
                      color="white"
                      position="relative"
                      overflow="hidden"
                      _before={{
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: isSelected ? 'var(--neon-green)' : 'transparent',
                        opacity: isSelected ? 0.2 : 0,
                        transition: 'opacity 0.3s ease'
                      }}
                    >
                      <Icon as={IconComponent} boxSize={8} />
                    </Box>

                    {/* 主题信息 */}
                    <VStack spacing={2} align="center">
                      <HStack align="center" spacing={2}>
                        <Text fontSize="xl" fontWeight="bold" color="var(--text-primary)">
                          {theme.name}
                        </Text>
                        <Text fontSize="2xl">{theme.icon}</Text>
                      </HStack>
                      
                      <Text 
                        fontSize="sm" 
                        color="var(--text-secondary)"
                        lineHeight="tall"
                        noOfLines={2}
                      >
                        {themeDescriptions[theme.id] || '神秘的推理挑战等待着你'}
                      </Text>
                    </VStack>

                    {/* 选择状态指示 */}
                    {isSelected && (
                      <Badge 
                        colorScheme="green" 
                        variant="solid"
                        px={3}
                        py={1}
                        borderRadius="full"
                        className="page-slide-left"
                      >
                        ✓ 已选择
                      </Badge>
                    )}
                  </VStack>
                </CardBody>
              </Card>
            );
          })}
        </Grid>

        {/* 底部操作区域 */}
        <VStack spacing={6} align="center">
          {/* 选择信息显示 */}
          {selectedTheme && (
            <Card 
              bg="var(--glass-bg)" 
              borderColor="var(--border-accent)"
              borderWidth="1px"
              className="page-slide-right"
            >
              <CardBody p={4}>
                <HStack spacing={4} align="center">
                  <Box
                    p={2}
                    borderRadius="lg"
                    background={selectedTheme.background || 'var(--midnight-blue)'}
                    color="white"
                  >
                    <Icon as={themeIcons[selectedTheme.id]} boxSize={5} />
                  </Box>
                  <VStack align="start" spacing={0}>
                    <Text fontSize="lg" fontWeight="bold" color="var(--text-primary)">
                      已选择主题：{selectedTheme.name} {selectedTheme.icon}
                    </Text>
                    <Text fontSize="sm" color="var(--text-muted)">
                      {themeDescriptions[selectedTheme.id]}
                    </Text>
                  </VStack>
                </HStack>
              </CardBody>
            </Card>
          )}

          {/* 继续按钮 */}
          <Button
            size="lg"
            className="mystery-button"
            bg="var(--neon-green)"
            color="var(--primary-dark)"
            px={12}
            py={6}
            fontSize="lg"
            fontWeight="bold"
            rightIcon={<FaArrowRight />}
            onClick={handleContinue}
            isLoading={isSubmitting}
            loadingText="准备中..."
            isDisabled={!selectedTheme}
            _hover={{
              transform: "translateY(-2px)",
              boxShadow: "var(--shadow-glow)"
            }}
            _disabled={{
              opacity: 0.5,
              cursor: "not-allowed",
              transform: "none"
            }}
          >
            {selectedTheme ? '选择难度等级' : '请先选择主题'}
          </Button>

          {!selectedTheme && (
            <Text 
              fontSize="sm" 
              color="var(--text-muted)" 
              textAlign="center"
              className="page-slide-left"
            >
              💡 点击上方任意主题卡片来开始你的推理之旅
            </Text>
          )}
        </VStack>

        {/* 游戏介绍 */}
        <Card 
          mt={10} 
          bg="var(--glass-bg)" 
          borderColor="var(--border-color)"
          className="page-slide-right"
        >
          <CardBody>
            <VStack spacing={4} align="start">
              <Text fontSize="lg" fontWeight="bold" color="var(--text-accent)">
                🔍 关于海龟汤游戏
              </Text>
              <Text fontSize="sm" color="var(--text-secondary)" lineHeight="tall">
                海龟汤是一种经典的推理游戏，通过提出只能用"是"或"否"回答的问题，
                逐步揭开故事背后的真相。每个主题都包含不同风格的谜题，
                从简单的逻辑推理到复杂的心理分析，挑战你的思维极限。
              </Text>
              <HStack spacing={6} wrap="wrap">
                <HStack spacing={2}>
                  <Box w={2} h={2} bg="var(--neon-green)" borderRadius="full" />
                  <Text fontSize="xs" color="var(--text-muted)">
                    12种不同主题
                  </Text>
                </HStack>
                <HStack spacing={2}>
                  <Box w={2} h={2} bg="var(--neon-green)" borderRadius="full" />
                  <Text fontSize="xs" color="var(--text-muted)">
                    4个难度等级
                  </Text>
                </HStack>
                <HStack spacing={2}>
                  <Box w={2} h={2} bg="var(--neon-green)" borderRadius="full" />
                  <Text fontSize="xs" color="var(--text-muted)">
                    AI智能出题
                  </Text>
                </HStack>
                <HStack spacing={2}>
                  <Box w={2} h={2} bg="var(--neon-green)" borderRadius="full" />
                  <Text fontSize="xs" color="var(--text-muted)">
                    线索提示系统
                  </Text>
                </HStack>
              </HStack>
            </VStack>
          </CardBody>
        </Card>
      </Box>
    </Box>
  );
};

export default ThemeSelector;