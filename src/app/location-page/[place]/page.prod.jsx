'use client'

import LocationDisplay from '../../../components/LocationDisplay.prod.jsx'
import styles from '../../../styles/pages/locationDisplay.module.css'

const LocationPage = ({ params }) => {
    return (
        <div className={styles.search_display_container}>
            <LocationDisplay
                locationData={{ name: params.place }}
            />
        </div>
    )
}

export default LocationPage