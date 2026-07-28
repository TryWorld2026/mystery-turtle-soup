import React, { useState } from 'react';
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
  useToast
} from '@chakra-ui/react';
import { 
  FaGamepad, 
  FaBrain, 
  FaFire, 
  FaSkull,
  FaArrowLeft,
  FaPlay
} from 'react-icons/fa';

const DifficultySelector = ({ selectedTheme, onDifficultySelect, onBack }) => {
  const [selectedDifficulty, setSelectedDifficulty] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  const difficulties = [
    {
      id: 'easy',
      name: '简单',
      desc: '基础推理，线索明显',
      icon: FaGamepad,
      color: '#4caf50',
      gradient: 'linear-gradient(135deg, #4caf50, #8bc34a)',
      features: ['线索丰富', '逻辑简单', '适合新手'],
      estimatedTime: '5-10分钟'
    },
    {
      id: 'medium',
      name: '中等',
      desc: '需要一定逻辑思考',
      icon: FaBrain,
      color: '#ff9800',
      gradient: 'linear-gradient(135deg, #ff9800, #ffc107)',
      features: ['适度挑战', '逻辑推理', '线索隐蔽'],
      estimatedTime: '10-20分钟'
    },
    {
      id: 'hard',
      name: '困难',
      desc: '复杂推理，线索隐蔽',
      icon: FaFire,
      color: '#f44336',
      gradient: 'linear-gradient(135deg, #f44336, #e91e63)',
      features: ['深度思考', '复杂逻辑', '线索稀少'],
      estimatedTime: '20-30分钟'
    },
    {
      id: 'nightmare',
      name: '噩梦',
      desc: '极端挑战，大师级推理',
      icon: FaSkull,
      color: '#9c27b0',
      gradient: 'linear-gradient(135deg, #9c27b0, #673ab7)',
      features: ['极限挑战', '大师级别', '几乎无线索'],
      estimatedTime: '30+分钟'
    }
  ];

  const handleDifficultySelect = (difficulty) => {
    setSelectedDifficulty(difficulty.id);
  };

  const handleStartGame = async () => {
    if (!selectedDifficulty) {
      toast({
        title: "请选择难度",
        description: "请先选择一个难度等级",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/generate-question', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          theme: selectedTheme.id,
          difficulty: selectedDifficulty
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: 服务器响应错误`);
      }

      const gameData = await response.json();
      
      toast({
        title: "游戏开始！",
        description: "题目生成成功，开始你的推理之旅",
        status: "success",
        duration: 2000,
        isClosable: true,
      });

      onDifficultySelect(selectedDifficulty, gameData);

    } catch (error) {
      console.error('开始游戏失败:', error);
      toast({
        title: "生成失败",
        description: error.message || '无法生成题目，请重试',
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box 
      className="page-enter"
      minH="100vh" 
      bg="var(--primary-dark)" 
      p={4}
    >
      <Box maxW="1000px" mx="auto" py={8}>
        {/* 标题区域 */}
        <VStack spacing={6} mb={8} textAlign="center">
          <HStack spacing={4}>
            <Button
              variant="ghost"
              leftIcon={<FaArrowLeft />}
              onClick={onBack}
              color="var(--text-secondary)"
              _hover={{
                color: "var(--text-accent)",
                bg: "var(--glass-bg)"
              }}
            >
              返回主题选择
            </Button>
          </HStack>

          <Box>
            <Text fontSize="3xl" fontWeight="bold" mb={2}>
              选择难度等级
            </Text>
            <Text color="var(--text-secondary)" fontSize="lg">
              主题：{selectedTheme?.name} {selectedTheme?.icon}
            </Text>
          </Box>

          <Text 
            color="var(--text-muted)" 
            fontSize="md" 
            maxW="600px"
            lineHeight="tall"
          >
            不同的难度等级将影响题目复杂度、线索数量和AI回答的精确程度。选择适合你推理水平的难度开始游戏。
          </Text>
        </VStack>

        {/* 难度选择网格 */}
        <Grid 
          templateColumns={{ 
            base: "repeat(1, 1fr)", 
            md: "repeat(2, 1fr)" 
          }} 
          gap={6} 
          mb={8}
        >
          {difficulties.map((difficulty, index) => (
            <Card
              key={difficulty.id}
              className={`difficulty-card ${selectedDifficulty === difficulty.id ? 'selected' : ''}`}
              bg="var(--glass-bg)"
              borderColor={selectedDifficulty === difficulty.id ? "var(--border-accent)" : "var(--border-color)"}
              borderWidth="2px"
              cursor="pointer"
              onClick={() => handleDifficultySelect(difficulty)}
              transition="all 0.3s ease"
              _hover={{
                transform: "translateY(-4px)",
                boxShadow: "var(--shadow-md)",
                borderColor: "var(--border-accent)"
              }}
              style={{
                animationDelay: `${index * 0.1}s`
              }}
            >
              <CardBody p={6}>
                <VStack spacing={4} align="stretch">
                  {/* 难度图标和名称 */}
                  <HStack justify="space-between" align="center">
                    <HStack spacing={3}>
                      <Box
                        p={3}
                        borderRadius="lg"
                        bg={difficulty.color}
                        color="white"
                      >
                        <Icon as={difficulty.icon} boxSize={6} />
                      </Box>
                      <VStack align="start" spacing={0}>
                        <Text fontSize="xl" fontWeight="bold" color="var(--text-primary)">
                          {difficulty.name}
                        </Text>
                        <Text fontSize="sm" color="var(--text-muted)">
                          {difficulty.estimatedTime}
                        </Text>
                      </VStack>
                    </HStack>
                    
                    {selectedDifficulty === difficulty.id && (
                      <Badge colorScheme="green" variant="solid">
                        已选择
                      </Badge>
                    )}
                  </HStack>

                  {/* 描述 */}
                  <Text 
                    color="var(--text-secondary)" 
                    fontSize="md"
                    lineHeight="tall"
                  >
                    {difficulty.desc}
                  </Text>

                  {/* 特性列表 */}
                  <VStack align="stretch" spacing={2}>
                    {difficulty.features.map((feature, idx) => (
                      <HStack key={idx} spacing={2}>
                        <Box
                          w={2}
                          h={2}
                          bg="var(--neon-green)"
                          borderRadius="full"
                        />
                        <Text fontSize="sm" color="var(--text-secondary)">
                          {feature}
                        </Text>
                      </HStack>
                    ))}
                  </VStack>

                  {/* 难度条 */}
                  <Box>
                    <HStack justify="space-between" mb={1}>
                      <Text fontSize="xs" color="var(--text-muted)">
                        挑战程度
                      </Text>
                      <Text fontSize="xs" color="var(--text-muted)">
                        {difficulty.id === 'easy' ? '★☆☆☆' : 
                         difficulty.id === 'medium' ? '★★☆☆' :
                         difficulty.id === 'hard' ? '★★★☆' : '★★★★'}
                      </Text>
                    </HStack>
                    <Box
                      h={2}
                      bg="var(--secondary-dark)"
                      borderRadius="full"
                      overflow="hidden"
                    >
                      <Box
                        h="100%"
                        bg={difficulty.gradient}
                        borderRadius="full"
                        w={
                          difficulty.id === 'easy' ? '25%' :
                          difficulty.id === 'medium' ? '50%' :
                          difficulty.id === 'hard' ? '75%' : '100%'
                        }
                        transition="width 0.5s ease"
                      />
                    </Box>
                  </Box>
                </VStack>
              </CardBody>
            </Card>
          ))}
        </Grid>

        {/* 开始游戏按钮 */}
        <Box textAlign="center">
          <Button
            size="lg"
            className="mystery-button"
            bg="var(--neon-green)"
            color="var(--primary-dark)"
            px={12}
            py={6}
            fontSize="lg"
            fontWeight="bold"
            leftIcon={<FaPlay />}
            onClick={handleStartGame}
            isLoading={isLoading}
            loadingText="生成题目中..."
            isDisabled={!selectedDifficulty}
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
            {selectedDifficulty ? '开始推理挑战' : '请选择难度等级'}
          </Button>

          {selectedDifficulty && (
            <Text 
              fontSize="sm" 
              color="var(--text-muted)" 
              mt={3}
              className="page-slide-left"
            >
              💡 选择的难度：{difficulties.find(d => d.id === selectedDifficulty)?.name} - 
              预计用时：{difficulties.find(d => d.id === selectedDifficulty)?.estimatedTime}
            </Text>
          )}
        </Box>

        {/* 游戏规则提示 */}
        <Card 
          mt={8} 
          bg="var(--glass-bg)" 
          borderColor="var(--border-color)"
          className="page-slide-right"
        >
          <CardBody>
            <VStack spacing={3} align="start">
              <Text fontSize="lg" fontWeight="bold" color="var(--text-accent)">
                🎯 游戏规则
              </Text>
              <VStack spacing={2} align="start" pl={4}>
                <Text fontSize="sm" color="var(--text-secondary)">
                  • 你只能提出能用"是"或"否"回答的问题
                </Text>
                <Text fontSize="sm" color="var(--text-secondary)">
                  • AI会根据你的问题给出"是"、"否"、"无关"或"线索错误"的回答
                </Text>
                <Text fontSize="sm" color="var(--text-secondary)">
                  • 提问达到一定数量后，系统会自动提供关键线索
                </Text>
                <Text fontSize="sm" color="var(--text-secondary)">
                  • 当你认为找到答案时，输入"答案是..."来提交最终答案
                </Text>
              </VStack>
            </VStack>
          </CardBody>
        </Card>
      </Box>
    </Box>
  );
};

export default DifficultySelector;