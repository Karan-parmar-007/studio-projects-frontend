import java.util.Properties

plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

// The server every app request goes to. Users never see or change it. For a test build
// against another server: ./gradlew assembleDebug -PstudioUrl=http://192.168.0.10:8001
val studioUrl: String = (project.findProperty("studioUrl") as String?) ?: "https://studio.karanparmar.in"

// Optional release signing: put release.keystore + keystore.properties next to this project.
val keystoreFile = rootProject.file("release.keystore")
val keystoreProps = Properties().apply {
    val f = rootProject.file("keystore.properties")
    if (f.exists()) f.inputStream().use { load(it) }
}

android {
    namespace = "studio.karanparmar.flow"
    compileSdk = 34

    defaultConfig {
        applicationId = "studio.karanparmar.flow"
        minSdk = 26
        targetSdk = 34
        versionCode = (project.findProperty("versionCode") as String?)?.toInt() ?: 1
        versionName = (project.findProperty("versionName") as String?) ?: "1.0"
        buildConfigField("String", "STUDIO_URL", "\"$studioUrl\"")
        // Plain http is allowed only for a test build pointed at an http server.
        manifestPlaceholders["cleartext"] = studioUrl.startsWith("http://").toString()
    }

    buildFeatures {
        buildConfig = true
    }

    signingConfigs {
        if (keystoreFile.exists() && keystoreProps.isNotEmpty()) {
            create("release") {
                storeFile = keystoreFile
                storePassword = keystoreProps.getProperty("storePassword")
                keyAlias = keystoreProps.getProperty("keyAlias")
                keyPassword = keystoreProps.getProperty("keyPassword")
            }
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            signingConfig = signingConfigs.findByName("release") ?: signingConfigs.getByName("debug")
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }
}

kotlin {
    jvmToolchain(17)
}
