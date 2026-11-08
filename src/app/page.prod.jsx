"use client";
import React from "react";
import styles from "../styles/genjiHomePage.module.css";

const GenjiHomePage = () => {
  return (
    <div className={styles.pageContainer}>
      <section className={styles.heroImageSection}>
        <img
          className={styles.fullBackgroundImage}
          src="/images/genji_background_compressed.jpg"
          alt="Genji background"
        />
      </section>

      <section className={styles.descriptionSection}>
        <div className={styles.contentWrapper}>
          <div className={styles.descriptionText}>
            <img
              src="/images/homepage_text.svg"
              alt="The Tale of Genji Description"
              style={{ width: "600px", height: "1106px" }}
            />
          </div>

          <div className={styles.statsContainer}>
            <img
              src="/images/genji_stats.png"
              alt="The Tale of Genji Statistics"
              className={styles.statsImage}
            />
          </div>
        </div>
      </section>
    </div>
  );
};

export default GenjiHomePage;