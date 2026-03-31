export const majorSuggestions = [
  "Công nghệ thông tin",
  "Khoa học máy tính",
  "Hệ thống thông tin",
  "Kỹ thuật phần mềm",
  "Kinh tế",
  "Quản trị kinh doanh",
  "Marketing",
  "Ngôn ngữ Anh",
  "Thiết kế đồ họa",
  "Cơ điện tử",
];

export const courseCodeSuggestions = [
  "MATH101",
  "CS101",
  "STAT201",
  "PHYS100",
  "CHEM205",
  "ART210",
  "ENGR120",
  "IT204",
];

const unique = (items) => [...new Set(items)];

export const normalizeTrackedCourseCodes = (value) =>
  unique(
    String(value || "")
      .split(/[,\n]/)
      .map((item) => item.trim().toUpperCase())
      .filter(Boolean)
  ).slice(0, 6);

export const getPasswordStrengthMeta = (password, language = "vi") => {
  const value = String(password || "");

  if (!value) {
    return language === "vi"
      ? {
          label: "Chưa có",
          tone: "idle",
          score: 0,
          hint: "Dùng ít nhất 6 ký tự, nên có chữ hoa và số để tài khoản an toàn hơn.",
        }
      : {
          label: "Empty",
          tone: "idle",
          score: 0,
          hint: "Use at least 6 characters and mix uppercase letters with numbers.",
        };
  }

  const categoryCount = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((rule) =>
    rule.test(value)
  ).length;

  if (value.length < 6 || categoryCount <= 1) {
    return language === "vi"
      ? {
          label: "Yếu",
          tone: "weak",
          score: 28,
          hint: "Thêm độ dài hoặc kết hợp chữ hoa, chữ thường, số để dễ bảo vệ tài khoản hơn.",
        }
      : {
          label: "Weak",
          tone: "weak",
          score: 28,
          hint: "Add more length and mix upper/lowercase letters with numbers.",
        };
  }

  if (value.length >= 10 && categoryCount >= 3) {
    return language === "vi"
      ? {
          label: "Mạnh",
          tone: "strong",
          score: 100,
          hint: "Mật khẩu này đủ tốt cho tài khoản dùng để nhắn tin, lưu tin và theo dõi giao dịch.",
        }
      : {
          label: "Strong",
          tone: "strong",
          score: 100,
          hint: "This password is solid for an account used across chat, saved items, and transactions.",
        };
  }

  return language === "vi"
    ? {
        label: "Ổn",
        tone: "medium",
        score: 64,
        hint: "Có thể mạnh hơn nữa nếu thêm ký tự đặc biệt hoặc tăng độ dài.",
      }
    : {
        label: "Okay",
        tone: "medium",
        score: 64,
        hint: "Add a symbol or more characters if you want stronger protection.",
      };
};

export const getAcademicEmailHint = (email, language = "vi") => {
  const value = String(email || "").trim().toLowerCase();

  if (!value) {
    return language === "vi"
      ? {
          tone: "neutral",
          message:
            "Ưu tiên email sinh viên để nhận thông báo wishlist, mã môn theo dõi và lịch meetup trên cùng một tài khoản.",
        }
      : {
          tone: "neutral",
          message:
            "Using your student email makes it easier to manage wishlist alerts, tracked courses, and meetup updates in one place.",
        };
  }

  const looksAcademic = /\.(edu(\.[a-z]{2})?|ac\.[a-z]{2,}|edu\.vn)$/i.test(value);

  if (looksAcademic) {
    return language === "vi"
      ? {
          tone: "success",
          message: "Email này trông giống email trường, rất hợp để theo dõi giáo trình và thông báo học vụ.",
        }
      : {
          tone: "success",
          message: "This looks like a school email, which is a great fit for course material alerts and campus updates.",
        };
  }

  return language === "vi"
    ? {
        tone: "neutral",
        message: "Bạn vẫn có thể dùng email cá nhân, nhưng email trường sẽ giúp tài khoản đúng ngữ cảnh sinh viên hơn.",
      }
    : {
        tone: "neutral",
        message: "A personal email is fine too, but a school email keeps the account more student-focused.",
      };
};

export const getAuthContextNotice = (pathname, language = "vi") => {
  const targetPath = String(pathname || "");

  if (!targetPath) {
    return null;
  }

  const viFallback = {
    title: "Đăng nhập để tiếp tục",
    body: "Sau khi đăng nhập, bạn sẽ được đưa lại đúng bước đang làm trên EduShare.",
  };

  const enFallback = {
    title: "Sign in to continue",
    body: "After signing in, we will send you right back to the step you were trying to finish.",
  };

  if (targetPath.startsWith("/listing/")) {
    return language === "vi"
      ? {
          title: "Đăng nhập để tiếp tục thao tác với tin đăng",
          body: "Bạn sẽ quay lại trang chi tiết để nhắn người bán, lưu tin hoặc đặt trước giáo trình ngay.",
        }
      : {
          title: "Sign in to continue with this listing",
          body: "You will be sent back to the listing so you can save it, message the seller, or reserve it right away.",
        };
  }

  if (targetPath === "/listing/new") {
    return language === "vi"
      ? {
          title: "Đăng nhập để đăng giáo trình",
          body: "Tạo tài khoản xong là bạn có thể đăng sách, tài liệu hoặc dụng cụ học tập ngay.",
        }
      : {
          title: "Sign in to post course materials",
          body: "Once your account is ready, you can immediately post books, notes, or study tools.",
        };
  }

  if (targetPath.startsWith("/messages")) {
    return language === "vi"
      ? {
          title: "Đăng nhập để mở hộp thư",
          body: "Tin nhắn với người mua, người bán và admin sẽ nằm chung trong một nơi để bạn theo dõi dễ hơn.",
        }
      : {
          title: "Sign in to open your inbox",
          body: "Messages with buyers, sellers, and admins stay in one place so it is easier to track your deals.",
        };
  }

  if (targetPath.startsWith("/meetup")) {
    return language === "vi"
      ? {
          title: "Đăng nhập để lên lịch meetup",
          body: "EduShare cần tài khoản để gợi ý điểm hẹn an toàn và lưu xác nhận giữa hai bên.",
        }
      : {
          title: "Sign in to plan a meetup",
          body: "EduShare needs your account to suggest safer meetup points and store confirmations for both sides.",
        };
  }

  if (targetPath.startsWith("/profile")) {
    return language === "vi"
      ? {
          title: "Đăng nhập để xem hồ sơ tin cậy",
          body: "Hồ sơ của bạn chứa độ uy tín, lịch sử giao dịch và các tùy chọn meetup phù hợp trong trường.",
        }
      : {
          title: "Sign in to view your trust profile",
          body: "Your profile keeps trust signals, transaction history, and preferred meetup settings together.",
        };
  }

  if (targetPath.startsWith("/transactions")) {
    return language === "vi"
      ? {
          title: "Đăng nhập để xem lịch sử giao dịch",
          body: "Bạn sẽ quay lại đúng trang lịch sử để theo dõi tiến độ mua bán sau khi xác thực.",
        }
      : {
          title: "Sign in to review transactions",
          body: "You will return to the transaction history page right after authentication.",
        };
  }

  return language === "vi" ? viFallback : enFallback;
};
