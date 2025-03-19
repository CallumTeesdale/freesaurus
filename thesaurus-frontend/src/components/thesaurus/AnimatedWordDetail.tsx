import {useEffect, useState} from "react";
import {AnimatePresence, motion} from "framer-motion";
import {Box} from "@mantine/core";
import WordDetail from "./WordDetail";

interface AnimatedWordDetailProps {
    word: string;
}

const containerVariants = {
    hidden: {opacity: 0},
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};
const AnimatedWordDetail = ({word}: AnimatedWordDetailProps) => {
    const [currentWord, setCurrentWord] = useState(word);
    const [isChanging, setIsChanging] = useState(false);

    useEffect(() => {
        if (currentWord !== word) {
            setIsChanging(true);
            const timer = setTimeout(() => {
                setCurrentWord(word);
                setIsChanging(false);
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [word, currentWord]);

    return (
        <Box>
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentWord}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    variants={containerVariants}
                >
                    {!isChanging && <WordDetail word={currentWord}/>}
                </motion.div>
            </AnimatePresence>
        </Box>
    );
};

export default AnimatedWordDetail;