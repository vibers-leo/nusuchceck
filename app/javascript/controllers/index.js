import { application } from "controllers/application"
import EstimateItemsController from "controllers/estimate_items_controller"
import DismissibleController from "controllers/dismissible_controller"
import StarRatingController from "controllers/star_rating_controller"
import PhotoUploadController from "controllers/photo_upload_controller"
import InsuranceFormController from "controllers/insurance_form_controller"
import MobileMenuController from "controllers/mobile_menu_controller"
import FormValidationController from "controllers/form_validation_controller"
import ToastController from "controllers/toast_controller"
import ToggleController from "controllers/toggle_controller"
import BottomSheetController from "controllers/bottom_sheet_controller"
import TabController from "controllers/tab_controller"
import ScrollRevealController from "controllers/scroll_reveal_controller"
import NativeBridgeController from "controllers/native_bridge_controller"
import CheckWizardController from "controllers/check_wizard_controller"
import FileCounterController from "controllers/file_counter_controller"
import AddressSearchController from "controllers/address_search_controller"
import ChatController from "controllers/chat_controller"
import LoadingController from "controllers/loading_controller"
import NotificationsController from "controllers/notifications_controller"
import ErrorTrackingController from "controllers/error_tracking_controller"
import InsuranceStepController from "controllers/insurance_step_controller"
import ButtonLoadingController from "controllers/button_loading_controller"
import UploadProgressController from "controllers/upload_progress_controller"
import VideoCompressorController from "controllers/video_compressor_controller"
import OnboardingController from "controllers/onboarding_controller"
import ButtonSelectController from "controllers/button_select_controller"
import UserMenuController from "controllers/user_menu_controller"
import EmojiPickerController from "controllers/emoji_picker_controller"
import VideoPlayerController from "controllers/video_player_controller"
import ChatWizardController from "controllers/chat_wizard_controller"

application.register("estimate-items", EstimateItemsController)
application.register("dismissible", DismissibleController)
application.register("star-rating", StarRatingController)
application.register("photo-upload", PhotoUploadController)
application.register("insurance-form", InsuranceFormController)
application.register("mobile-menu", MobileMenuController)
application.register("form-validation", FormValidationController)
application.register("toast", ToastController)
application.register("toggle", ToggleController)
application.register("bottom-sheet", BottomSheetController)
application.register("tab", TabController)
application.register("scroll-reveal", ScrollRevealController)
application.register("native-bridge", NativeBridgeController)
application.register("check-wizard", CheckWizardController)
application.register("file-counter", FileCounterController)
application.register("address-search", AddressSearchController)
application.register("chat", ChatController)
application.register("loading", LoadingController)
application.register("notifications", NotificationsController)
application.register("error-tracking", ErrorTrackingController)
application.register("insurance-step", InsuranceStepController)
application.register("button-loading", ButtonLoadingController)
application.register("upload-progress", UploadProgressController)
application.register("video-compressor", VideoCompressorController)
application.register("onboarding", OnboardingController)
application.register("button-select", ButtonSelectController)
application.register("user-menu", UserMenuController)
application.register("emoji-picker", EmojiPickerController)
application.register("video-player", VideoPlayerController)
application.register("chat-wizard", ChatWizardController)
