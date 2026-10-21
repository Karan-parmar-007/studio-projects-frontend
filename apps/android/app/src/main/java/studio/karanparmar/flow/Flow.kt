package studio.karanparmar.flow

/** In-process links between the bubble (accessibility service) and the recorder service. */
object Flow {
    @Volatile var recorder: RecorderService? = null
    @Volatile var bubble: FlowAccessibilityService? = null
}
