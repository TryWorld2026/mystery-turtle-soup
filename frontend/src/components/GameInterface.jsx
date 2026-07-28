import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Input,
  Button,
  Card,
  CardBody,
  Flex,
  Badge,
  Divider,
  Alert,
  AlertIcon,
  Spinner,
  useToast
} from '@chakra-ui/react';
import { FaLightbulb, FaPaperPlane, FaQuestion, FaRobot } from 'react-icons/fa';

const GameInterface = ({ sessionData, onGameComplete, onBackToMenu }) => {
  const [userInput, setUserInput] = useState('');
  const [qaHistory, setQaHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [clues, setClues] = useState([]);
  const [gameStats, setGameStats] = useState({
    questionsAsked: 0,
    cluesReceived: 0,
    timeElapsed: 0
  });
  const [startTime] = useState(Date.now());
  const [gameStatus, setGameStatus] = useState('active');
  const [showAnswerOptions, setShowAnswerOptions] = useState(false);
  const [correctAnswer, setCorrectAnswer] = useState('');
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const toast = useToast();

  // 预设快捷提问
  const quickQuestions = [
    { category: '基础推理', questions: ['是自杀吗？', '是他杀吗？', '是意外吗？', '有目击者吗？'] },
    { category: '时间地点', questions: ['与时间有关吗？', '与地点有关吗？', '发生在夜晚吗？', '在室内发生吗？'] },
    { category: '人物关系', questions: ['认识死者吗？', '是亲属关系吗？', '有仇恨吗？', '涉及金钱吗？'] },
    { category: '物证线索', questions: ['有武器吗？', '现场有异常吗？', '留有遗言吗？', '有特殊物品吗？'] }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      if (gameStatus === 'active') {
        setGameStats(prev => ({
          ...prev,
          timeElapsed: Math.floor((Date.now() - startTime) / 1000)
        }));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime, gameStatus]);

  useEffect(() => {
    scrollToBottom();
  }, [qaHistory]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userInput.trim() || isLoading) return;

    const currentInput = userInput.trim();
    setUserInput('');
    setIsLoading(true);

    // 立即添加用户问题到历史记录（优化用户体验）
    const tempQA = {
      id: Date.now(),
      question: currentInput,
      answer: '正在思考中...',
      type: 'loading',
      timestamp: new Date().toLocaleTimeString(),
      isLoading: true
    };
    setQaHistory(prev => [...prev, tempQA]);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15秒超时
      
      const response = await fetch('/api/answer-question', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: sessionData.sessionId,
          question: sessionData.question,
          answer: sessionData.answer,
          difficulty: sessionData.difficultyId || sessionData.difficulty,
          qaHistory: qaHistory,
          cluesGiven: gameStats.cluesReceived,
          userInput: currentInput
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: 服务器响应错误`);
      }

      const result = await response.json();
      
      if (!result.success && result.error) {
        throw new Error(result.error);
      }
      
      // 更新历史记录中的临时问答
      const finalQA = {
        ...tempQA,
        answer: (result.response || result.message || '收到回复').replace(/由响指AI生成/g, ''),
        type: result.type,
        clue: result.clue ? result.clue.replace(/由响指AI生成/g, '') : result.clue,
        isLoading: false
      };

      setQaHistory(prev => prev.map(qa => qa.id === tempQA.id ? finalQA : qa));
      
      // 更新统计数据
      setGameStats(prev => ({
        ...prev,
        questionsAsked: prev.questionsAsked + 1,
        cluesReceived: result.cluesReceived ?? prev.cluesReceived
      }));

      // 处理线索
      if (result.clue) {
        setClues(prev => [...prev, {
          id: Date.now(),
          content: result.clue.replace(/由响指AI生成/g, ''),
          timestamp: new Date().toLocaleTimeString()
        }]);
        
        toast({
          title: "🎯 新线索获得！",
          description: "检查线索面板查看详情",
          status: "info",
          duration: 3000,
          isClosable: true,
          position: "top"
        });
      }

      // 处理答案结果
      if (result.type === 'answer_result') {
        if (result.isCorrect) {
          setGameStatus('completed');
          toast({
            title: "🎉 恭喜！",
            description: "你成功解开了这个海龟汤！",
            status: "success",
            duration: 5000,
            isClosable: true,
            position: "top"
          });
          
          setTimeout(() => {
            onGameComplete({
              ...result,
              stats: {
                ...gameStats,
                questionsAsked: gameStats.questionsAsked + 1
              },
              timeElapsed: Math.floor((Date.now() - startTime) / 1000)
            });
          }, 2000);
        } else {
          // 答案不正确时显示选项
          setShowAnswerOptions(true);
          setCorrectAnswer(result.correctAnswer || sessionData.answer || '答案暂时不可用');
          
          toast({
            title: "💭 答案不正确",
            description: "选择继续推理或查看正确答案",
            status: "warning",
            duration: 4000,
            isClosable: true,
            position: "top"
          });
        }
      }

      // 显示提示消息
      if (result.hint && result.type !== 'answer_result') {
        toast({
          title: "💡 提示",
          description: result.hint,
          status: "info",
          duration: 3000,
          isClosable: true,
          position: "top"
        });
      }

    } catch (error) {
      console.error('提交问题失败:', error);
      
      // 移除临时问答记录
      setQaHistory(prev => prev.filter(qa => qa.id !== tempQA.id));
      
      let errorMessage = "请检查网络连接后重试";
      if (error.name === 'AbortError') {
        errorMessage = "请求超时，请重试";
      } else if (error.message.includes('HTTP')) {
        errorMessage = error.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "❌ 提交失败",
        description: errorMessage,
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "top"
      });
    } finally {
      setIsLoading(false);
      // 移动端延迟聚焦，避免键盘闪烁
      setTimeout(() => {
        if (window.innerWidth > 768) {
          inputRef.current?.focus();
        }
      }, 100);
    }
  };

  const isAnswerSubmission = (text) => {
    return text.toLowerCase().includes('答案是') || 
           text.toLowerCase().includes('我的答案是') ||
           text.toLowerCase().includes('答案：');
  };

  // 处理快捷提问点击
  const handleQuickQuestion = (question) => {
    if (isLoading || gameStatus === 'completed') return;
    setUserInput(question);
    // 自动聚焦输入框
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  // 处理继续推理
  const handleContinueReasoning = () => {
    setShowAnswerOptions(false);
    setCorrectAnswer('');
    toast({
      title: "💪 继续推理",
      description: "加油！继续提问来找到正确答案",
      status: "info",
      duration: 3000,
      isClosable: true,
      position: "top"
    });
  };

  // 处理揭开谜底
  const handleRevealAnswer = () => {
    setGameStatus('revealed');
    setShowAnswerOptions(false);
    
    toast({
      title: "📖 谜底揭晓",
      description: "正确答案已显示，游戏结束",
      status: "success",
      duration: 5000,
      isClosable: true,
      position: "top"
    });
  };

  return (
    <Box 
      className="game-interface-enter"
      minH="100vh" 
      bg="var(--primary-dark)" 
      p={4}
    >
      {/* 顶部信息栏 */}
      <Card mb={4} bg="var(--glass-bg)" borderColor="var(--border-color)">
        <CardBody>
          <Flex justify="space-between" align="center" wrap="wrap" gap={4}>
            <VStack align="start" spacing={1}>
              <Text fontSize="lg" fontWeight="bold" color="var(--text-accent)">
                {sessionData.theme} • {sessionData.difficulty}
              </Text>
              <HStack spacing={4}>
                <Badge colorScheme="blue">问题: {gameStats.questionsAsked}</Badge>
                <Badge colorScheme="green">线索: {gameStats.cluesReceived}</Badge>
                <Badge colorScheme="purple">时间: {formatTime(gameStats.timeElapsed)}</Badge>
              </HStack>
            </VStack>
            
            <Button
              size="sm"
              variant="outline"
              onClick={onBackToMenu}
              isDisabled={isLoading}
            >
              返回菜单
            </Button>
          </Flex>
        </CardBody>
      </Card>

      <Flex gap={6} direction={{ base: 'column', lg: 'row' }} h={{ base: 'auto', lg: 'calc(100vh - 200px)' }}>
        {/* 左侧问答区域 */}
        <Box flex="2" minH="0">
          {/* 题目显示区 */}
          <Card className="question-display" mb={4}>
            <CardBody>
              <HStack mb={2}>
                <FaQuestion color="var(--neon-green)" />
                <Text fontSize="lg" fontWeight="bold" color="var(--text-accent)">
                  海龟汤题目
                </Text>
              </HStack>
              <Text color="var(--text-primary)" lineHeight="tall">
                {sessionData.question}
              </Text>
              {sessionData.hint && (
                <Alert status="info" mt={3} bg="var(--glass-bg)" borderColor="var(--border-accent)">
                  <AlertIcon />
                  <Text fontSize="sm">{sessionData.hint}</Text>
                </Alert>
              )}
            </CardBody>
          </Card>

          {/* 问答历史 */}
          <Card flex="1" bg="var(--glass-bg)" borderColor="var(--border-color)">
            <CardBody p={4}>
              <Box 
                h={{ base: '250px', md: '300px', lg: '400px' }} 
                overflowY="auto" 
                css={{
                  '&::-webkit-scrollbar': {
                    width: '6px',
                  },
                  '&::-webkit-scrollbar-track': {
                    background: 'var(--secondary-dark)',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    background: 'var(--neon-green)',
                    borderRadius: '3px',
                  },
                }}
              >
                {qaHistory.length === 0 ? (
                  <Box textAlign="center" py={8} color="var(--text-muted)">
                    <Box className="page-enter">
                      <FaRobot size={24} style={{ margin: '0 auto 12px' }} />
                      <Text mt={2} fontSize={{ base: 'sm', md: 'md' }} px={4}>
                        开始提问吧！我会用"是"、"否"、"无关"来回答你的问题
                      </Text>
                      <Text fontSize="xs" mt={2} opacity={0.7}>
                        💡 提示：尝试问一些能用是非回答的问题
                      </Text>
                    </Box>
                  </Box>
                ) : (
                  <VStack spacing={4} align="stretch">
                    {qaHistory.map((qa, index) => (
                      <Box key={qa.id} className="qa-item" style={{ animationDelay: `${index * 0.1}s` }}>
                        {/* 用户问题 */}
                        <Flex justify="flex-end" mb={2}>
                          <Box 
                            className="user-question" 
                            maxW={{ base: '85%', md: '75%' }}
                            bg={isAnswerSubmission(qa.question) ? "var(--blood-red)" : "var(--midnight-blue)"}
                            borderRadius="18px 18px 4px 18px"
                            p={{ base: 3, md: 4 }}
                            position="relative"
                          >
                            <Text fontSize={{ base: 'sm', md: 'md' }} color="white" lineHeight="1.4">
                              {qa.question}
                            </Text>
                            <Text fontSize="xs" color="rgba(255,255,255,0.6)" mt={1} textAlign="right">
                              {qa.timestamp}
                            </Text>
                            {isAnswerSubmission(qa.question) && (
                              <Box 
                                position="absolute" 
                                top="-8px" 
                                left="8px" 
                                bg="var(--neon-green)" 
                                color="var(--primary-dark)" 
                                fontSize="10px" 
                                px={2} 
                                py={1} 
                                borderRadius="full"
                                fontWeight="bold"
                              >
                                答案提交
                              </Box>
                            )}
                          </Box>
                        </Flex>
                        
                        {/* AI回答 */}
                        <Flex justify="flex-start">
                          <Box 
                            className="ai-response" 
                            maxW={{ base: '85%', md: '75%' }}
                            bg="var(--surface-dark)"
                            borderRadius="18px 18px 18px 4px"
                            p={{ base: 3, md: 4 }}
                            borderLeft="3px solid var(--neon-green)"
                            position="relative"
                          >
                            {qa.isLoading ? (
                              <HStack spacing={2} align="center">
                                <Spinner size="sm" color="var(--neon-green)" />
                                <Text fontSize={{ base: 'sm', md: 'md' }} color="var(--text-secondary)" fontStyle="italic">
                                  正在思考中...
                                </Text>
                              </HStack>
                            ) : (
                              <VStack align="stretch" spacing={2}>
                                <HStack spacing={2} align="center">
                                  <FaRobot size={12} color="var(--neon-green)" />
                                  <Text fontSize={{ base: 'sm', md: 'md' }} color="var(--text-primary)" fontWeight="medium">
                                    {qa.answer}
                                  </Text>
                                  {qa.type === 'answer_result' && (
                                    <Badge 
                                      colorScheme={qa.answer.includes('正确') ? 'green' : 'orange'} 
                                      size="sm" 
                                      ml={2}
                                    >
                                      {qa.answer.includes('正确') ? '✓ 正确' : '✗ 重试'}
                                    </Badge>
                                  )}
                                </HStack>
                                
                                {qa.clue && (
                                  <Box 
                                    mt={2} 
                                    p={{ base: 2, md: 3 }}
                                    bg="var(--midnight-blue)" 
                                    borderRadius="md"
                                    className="clue-reveal"
                                    border="1px solid var(--border-accent)"
                                    position="relative"
                                    _before={{
                                      content: '"✨"',
                                      position: 'absolute',
                                      top: '-8px',
                                      right: '8px',
                                      bg: 'var(--neon-green)',
                                      color: 'var(--primary-dark)',
                                      borderRadius: 'full',
                                      w: { base: '18px', md: '20px' },
                                      h: { base: '18px', md: '20px' },
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontSize: { base: '8px', md: '10px' },
                                      animation: 'pulseGlow 2s infinite'
                                    }}
                                  >
                                    <HStack spacing={2} align="center">
                                      <Box 
                                        p={1} 
                                        bg="var(--neon-green)" 
                                        borderRadius="sm"
                                        color="var(--primary-dark)"
                                      >
                                        <FaLightbulb size={8} />
                                      </Box>
                                      <Text 
                                        fontSize={{ base: 'xs', md: 'sm' }} 
                                        color="var(--text-accent)" 
                                        fontWeight="medium"
                                        lineHeight="1.3"
                                      >
                                        💡 {qa.clue}
                                      </Text>
                                    </HStack>
                                  </Box>
                                )}
                              </VStack>
                            )}
                          </Box>
                        </Flex>
                      </Box>
                    ))}
                    <div ref={messagesEndRef} />
                  </VStack>
                )}
              </Box>
              
              {/* 快捷提问区域 - 始终显示 */}
              <Box className="quick-questions" mb={4}>
                <Text className="quick-questions-title">
                  <FaLightbulb /> 快捷提问
                </Text>
                <VStack spacing={3} align="stretch">
                  {quickQuestions.map((category, categoryIndex) => (
                    <Box key={categoryIndex}>
                      <Text 
                        fontSize="xs" 
                        color="var(--text-accent)" 
                        fontWeight="bold" 
                        mb={2}
                        className="quick-questions-category"
                      >
                        {category.category}
                      </Text>
                      <Flex wrap="wrap" gap={2}>
                        {category.questions.map((question, questionIndex) => (
                          <Button
                            key={questionIndex}
                            size="sm"
                            variant="outline"
                            colorScheme="teal"
                            className="quick-question-btn"
                            onClick={() => handleQuickQuestion(question)}
                            isDisabled={isLoading || gameStatus === 'completed'}
                            fontSize={{ base: 'xs', md: 'sm' }}
                            px={3}
                            py={2}
                            h="auto"
                            minH="32px"
                            borderColor="var(--border-color)"
                            color="var(--text-secondary)"
                            bg="var(--glass-bg)"
                            _hover={{
                              borderColor: "var(--border-accent)",
                              color: "var(--text-accent)",
                              bg: "rgba(0, 230, 118, 0.1)"
                            }}
                            _active={{
                              transform: "scale(0.98)"
                            }}
                          >
                            {question}
                          </Button>
                        ))}
                      </Flex>
                    </Box>
                  ))}
                </VStack>
              </Box>

              {/* 输入区域 */}
              <Box mt={4}>
                <Box position="relative">
                  <form onSubmit={handleSubmit}>
                    <HStack spacing={2}>
                      <Box position="relative" flex="1">
                        <Input
                          ref={inputRef}
                          className="input-focus"
                          value={userInput}
                          onChange={(e) => setUserInput(e.target.value)}
                          placeholder={
                            gameStatus === 'completed' 
                              ? "游戏已结束" :
                            gameStatus === 'revealed'
                              ? "谜底已揭晓" :
                            showAnswerOptions
                              ? "请选择下一步操作" :
                            isAnswerSubmission(userInput) 
                              ? "提交你的最终答案..." 
                              : "问一个是非问题..."
                          }
                          isDisabled={isLoading || gameStatus === 'completed'}
                          bg="var(--glass-bg)"
                          borderColor={isAnswerSubmission(userInput) ? "var(--blood-red)" : "var(--border-color)"}
                          borderWidth="2px"
                          fontSize={{ base: 'sm', md: 'md' }}
                          p={{ base: 3, md: 4 }}
                          pr={{ base: 12, md: 14 }}
                          minH={{ base: '44px', md: '48px' }}
                          _focus={{
                            borderColor: isAnswerSubmission(userInput) ? "var(--blood-red)" : "var(--border-accent)",
                            boxShadow: isAnswerSubmission(userInput) 
                              ? "0 0 0 3px rgba(183, 28, 28, 0.2)" 
                              : "var(--shadow-glow)",
                            transform: { base: 'none', lg: 'scale(1.01)' }
                          }}
                          _placeholder={{
                            color: 'var(--text-muted)',
                            fontSize: { base: 'xs', md: 'sm' }
                          }}
                          _disabled={{
                            opacity: 0.6,
                            cursor: 'not-allowed'
                          }}
                        />
                        
                        {/* 字符计数器 */}
                        {userInput.length > 0 && (
                          <Text 
                            position="absolute" 
                            right="60px" 
                            top="50%" 
                            transform="translateY(-50%)"
                            fontSize="xs" 
                            color={userInput.length > 100 ? "var(--blood-red)" : "var(--text-muted)"}
                            pointerEvents="none"
                          >
                            {userInput.length}/100
                          </Text>
                        )}
                      </Box>
                      
                      <Button
                        type="submit"
                        className="mystery-button"
                        bg={
                          gameStatus === 'completed' ? "var(--text-muted)" :
                          isAnswerSubmission(userInput) ? "var(--blood-red)" : "var(--neon-green)"
                        }
                        color="var(--primary-dark)"
                        isLoading={isLoading}
                        isDisabled={!userInput.trim() || gameStatus === 'completed' || gameStatus === 'revealed' || userInput.length > 100 || showAnswerOptions}
                        size={{ base: 'md', md: 'lg' }}
                        minW={{ base: '50px', md: '60px' }}
                        minH={{ base: '44px', md: '48px' }}
                        _hover={{
                          transform: gameStatus === 'completed' ? 'none' : { base: 'scale(0.98)', lg: 'translateY(-2px)' },
                          boxShadow: gameStatus === 'completed' ? 'none' : "var(--shadow-glow)"
                        }}
                        _active={{
                          transform: gameStatus === 'completed' ? 'none' : 'scale(0.95)'
                        }}
                        _disabled={{
                          opacity: 0.5,
                          cursor: 'not-allowed',
                          transform: 'none'
                        }}
                        title={
                          gameStatus === 'completed' ? "游戏已结束" :
                          !userInput.trim() ? "请输入问题" :
                          userInput.length > 100 ? "问题过长" :
                          isAnswerSubmission(userInput) ? "提交最终答案" : "发送问题"
                        }
                      >
                        {isLoading ? (
                          <Spinner size="sm" />
                        ) : gameStatus === 'completed' ? (
                          "🏁"
                        ) : (
                          <FaPaperPlane />
                        )}
                      </Button>
                    </HStack>
                  </form>
                </Box>
                
                {isAnswerSubmission(userInput) && (
                  <Text fontSize="xs" color="var(--text-accent)" mt={1}>
                    💡 你正在提交最终答案
                  </Text>
                )}
              </Box>
              
              {/* 答案选择区域 */}
              {showAnswerOptions && (
                <Card 
                  mt={4}
                  bg="var(--glass-bg)" 
                  borderColor="var(--border-accent)"
                  borderWidth="2px"
                  className="page-slide-left"
                >
                  <CardBody p={4}>
                    <VStack spacing={4} align="stretch">
                      <HStack spacing={2} align="center">
                        <Text fontSize="lg" fontWeight="bold" color="var(--text-accent)">
                          🤔 答案不够准确
                        </Text>
                      </HStack>
                      
                      <Text fontSize="sm" color="var(--text-secondary)" lineHeight="tall">
                        你的答案还不够准确，选择下一步操作：
                      </Text>
                      
                      <HStack spacing={3} justify="center">
                        <Button
                          colorScheme="blue"
                          variant="solid"
                          onClick={handleContinueReasoning}
                          leftIcon={<FaLightbulb />}
                          size="md"
                          flex="1"
                          className="mystery-button"
                        >
                          继续推理
                        </Button>
                        
                        <Button
                          colorScheme="orange"
                          variant="outline"
                          onClick={handleRevealAnswer}
                          size="md"
                          flex="1"
                          borderWidth="2px"
                          _hover={{
                            bg: "rgba(251, 146, 60, 0.1)",
                            borderColor: "orange.400"
                          }}
                        >
                          揭开谜底
                        </Button>
                      </HStack>
                    </VStack>
                  </CardBody>
                </Card>
              )}
              
              {/* 谜底显示区域 */}
              {gameStatus === 'revealed' && correctAnswer && (
                <Card 
                  mt={4}
                  bg="var(--midnight-blue)" 
                  borderColor="var(--neon-green)"
                  borderWidth="2px"
                  className="clue-reveal"
                >
                  <CardBody p={4}>
                    <VStack spacing={3} align="stretch">
                      <HStack spacing={2} align="center">
                        <Text fontSize="lg" fontWeight="bold" color="var(--neon-green)">
                          📖 正确答案
                        </Text>
                      </HStack>
                      
                      <Text 
                        fontSize="md" 
                        color="var(--text-primary)"
                        lineHeight="tall"
                        p={3}
                        bg="rgba(0, 230, 118, 0.1)"
                        borderRadius="md"
                        border="1px solid var(--neon-green)"
                      >
                        {correctAnswer}
                      </Text>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        colorScheme="green"
                        onClick={onBackToMenu}
                        mt={2}
                      >
                        返回主菜单
                      </Button>
                    </VStack>
                  </CardBody>
                </Card>
              )}
            </CardBody>
          </Card>
        </Box>

        {/* 右侧线索收集区 */}
        <Box flex="1" minH="0" mt={{ base: 4, lg: 0 }}>
          <Card 
            h={{ base: '300px', lg: '100%' }} 
            bg="var(--glass-bg)" 
            borderColor="var(--border-color)"
            position="relative"
          >
            <CardBody>
              <HStack mb={4}>
                <FaLightbulb color="var(--neon-green)" />
                <Text fontSize="lg" fontWeight="bold" color="var(--text-accent)">
                  线索收集
                </Text>
                <Badge colorScheme="green" ml="auto">
                  {clues.length}
                </Badge>
              </HStack>
              
              <Divider mb={4} borderColor="var(--border-color)" />
              
              <Box 
                h={{ base: '200px', lg: 'calc(100% - 80px)' }} 
                overflowY="auto"
                css={{
                  '&::-webkit-scrollbar': {
                    width: '6px',
                  },
                  '&::-webkit-scrollbar-track': {
                    background: 'var(--secondary-dark)',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    background: 'var(--neon-green)',
                    borderRadius: '3px',
                  },
                }}
              >
                {clues.length === 0 ? (
                  <Box textAlign="center" py={8} color="var(--text-muted)">
                    <Text>暂无线索</Text>
                    <Text fontSize="sm" mt={1}>
                      继续提问来获取线索吧！
                    </Text>
                  </Box>
                ) : (
                  <VStack spacing={3} align="stretch">
                    {clues.map((clue, index) => (
                      <Card
                        key={clue.id}
                        size="sm"
                        bg="var(--midnight-blue)"
                        borderColor="var(--border-accent)"
                        className="clue-reveal"
                        border="2px solid var(--border-accent)"
                        position="relative"
                        _hover={{
                          transform: { base: 'none', lg: 'translateY(-2px)' },
                          boxShadow: 'var(--shadow-glow)'
                        }}
                        style={{
                          animationDelay: `${index * 0.2}s`
                        }}
                      >
                        <CardBody p={{ base: 3, md: 4 }}>
                          <HStack justify="space-between" mb={2}>
                            <HStack spacing={2}>
                              <Badge 
                                colorScheme="green" 
                                size="sm"
                                borderRadius="full"
                                px={2}
                              >
                                💡 #{index + 1}
                              </Badge>
                              {index === clues.length - 1 && (
                                <Badge 
                                  colorScheme="yellow" 
                                  size="sm"
                                  variant="outline"
                                  className="loading-pulse"
                                >
                                  新
                                </Badge>
                              )}
                            </HStack>
                            <Text fontSize="xs" color="var(--text-muted)">
                              {clue.timestamp}
                            </Text>
                          </HStack>
                          <Text 
                            fontSize={{ base: 'xs', md: 'sm' }} 
                            color="var(--text-primary)"
                            className="clue-text"
                            lineHeight="tall"
                            p={2}
                            bg="rgba(0, 230, 118, 0.1)"
                            borderRadius="md"
                            border="1px dashed var(--neon-green)"
                          >
                            {clue.content}
                          </Text>
                        </CardBody>
                      </Card>
                    ))}
                  </VStack>
                )}
              </Box>
            </CardBody>
          </Card>
        </Box>
      </Flex>
    </Box>
  );
};

export default GameInterface;