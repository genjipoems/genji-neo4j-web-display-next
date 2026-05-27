'use client'

import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import styles from "../../styles/pages/poemKeyWordSearchPageLayout.module.css";

const PoemSearch = dynamic(() => import("../../components/FilterSearch.prod"), { ssr: false });

export default function CharacterPage() {
    const params = useParams();
    return (
        <section className={styles.section_frame}>
            <div className={styles.section_container}>
                <PoemSearch/>
            </div>
        </section>
    );
}
